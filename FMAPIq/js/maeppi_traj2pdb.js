#!/usr/bin/env node

const CHAIN_IDS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

class Atom {
  constructor(line) {
    this.line = line.replace(/\n$/, '');
    this.prefix = line.substring(0, 30);
    this.suffix = line.length > 54 ? line.substring(54) : "";

    try {
      this.x = parseFloat(line.substring(30, 38));
      this.y = parseFloat(line.substring(38, 46));
      this.z = parseFloat(line.substring(46, 54));
    } catch (e) {
      this.x = this.y = this.z = 0.0;
    }

    this.chain_id = line.length > 53 ? line[21] : " ";
    this.element = line.length > 53 ? line[13] : " ";
    this.atom_name = line.length > 53 ? line.substring(12, 16).trim() : "";
  }

  toPdbLine(newChainId = null) {
    const prefix = this.prefix.split('');
    if (newChainId !== null && prefix.length > 21) {
      prefix[21] = newChainId;
    }
    return prefix.join('') +
           this.x.toFixed(3).padStart(8) +
           this.y.toFixed(3).padStart(8) +
           this.z.toFixed(3).padStart(8) +
           this.suffix;
  }
}

function eulerToRot(psi, theta, phi) {
  const cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
  const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
  const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

  return [
    [cosPsi * cosPhi - sinPsi * cosTheta * sinPhi,
     -cosPsi * sinPhi - sinPsi * cosTheta * cosPhi,
     sinPsi * sinTheta],
    [sinPsi * cosPhi + cosPsi * cosTheta * sinPhi,
     -sinPsi * sinPhi + cosPsi * cosTheta * cosPhi,
     -cosPsi * sinTheta],
    [sinTheta * sinPhi,
     sinTheta * cosPhi,
     cosTheta]
  ];
}

function parsePdbContent(content, onlyCA = false) {
  const lines = content.split('\n');
  const atoms = [];

  for (const line of lines) {
    if (line.startsWith("ATOM") || line.startsWith("HETATM")) {
      const atom = new Atom(line);
      if (onlyCA && atom.atom_name !== "CA") continue;
      atoms.push(atom);
    }
  }

  return atoms;
}

function countAtomsInTrajContent(content, isTxt) {
  const lines = content.split('\n');
  let count = 0, prevId = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isTxt) {
      if (trimmed.startsWith("MODEL") || trimmed.startsWith("ENDMDL")) continue;
      if (trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 7) {
        const atomId = parseInt(parts[0]);
        if (!isNaN(atomId)) {
          if (atomId > prevId) {
            prevId = atomId;
            count++;
          } else break;
        }
      }
    } else {
      if (trimmed.startsWith("ATOM")) {
        const atomId = parseInt(line.substring(6, 11));
        if (!isNaN(atomId)) {
          if (atomId > prevId) {
            prevId = atomId;
            count++;
          } else break;
        }
      }
    }
  }

  return count;
}

function readTransformationsFromContent(content, numAtoms, isTxt) {
  const lines = content.split('\n');
  const transformations = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (isTxt) {
      if (trimmed.startsWith("MODEL") || trimmed.startsWith("ENDMDL")) continue;
      if (trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 7) {
        const tr = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
        const xr = [parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6])];
        if (!tr.some(isNaN) && !xr.some(isNaN)) {
          transformations.push([tr, xr]);
        }
      }
    } else {
      if (trimmed.startsWith("ATOM")) {
        const values = [
          line.substring(30, 38), line.substring(38, 46), line.substring(46, 54),
          line.substring(54, 62), line.substring(62, 70), line.substring(70, 78)
        ];
        if (values.length >= 6) {
          const tr = values.slice(0, 3).map(parseFloat);
          const xr = values.slice(3, 6).map(parseFloat);
          if (!tr.some(isNaN) && !xr.some(isNaN)) {
            transformations.push([tr, xr]);
          }
        }
      }
    }

    if (transformations.length >= numAtoms) break;
  }

  return transformations;
}

function applyTransformation(atoms, tr, xr) {
  const rotMatrix = eulerToRot(xr[0], xr[1], xr[2]);
  const transformed = [];

  for (const atom of atoms) {
    const newAtom = new Atom(atom.toPdbLine());
    const coords = [atom.x, atom.y, atom.z];

    // Apply rotation: coords @ rotMatrix.T
    const rotated = [
      coords[0] * rotMatrix[0][0] + coords[1] * rotMatrix[0][1] + coords[2] * rotMatrix[0][2],
      coords[0] * rotMatrix[1][0] + coords[1] * rotMatrix[1][1] + coords[2] * rotMatrix[1][2],
      coords[0] * rotMatrix[2][0] + coords[1] * rotMatrix[2][1] + coords[2] * rotMatrix[2][2]
    ];

    newAtom.x = tr[0] + rotated[0];
    newAtom.y = tr[1] + rotated[1];
    newAtom.z = tr[2] + rotated[2];

    transformed.push(newAtom);
  }

  return transformed;
}

function writeExyz(atoms) {
  return atoms.map(atom =>
    `${atom.element} ${atom.x.toFixed(6).padStart(16)}${atom.y.toFixed(6).padStart(16)}${atom.z.toFixed(6).padStart(16)}`
  ).join('\n');
}

function traj2pdb(templateContent, trajContent, options = {}) {
  const { onlyCA = false, exyz = false, txt = false } = options;

  const templateAtoms = parsePdbContent(templateContent, onlyCA);
  const numTransformations = countAtomsInTrajContent(trajContent, txt);

  if (numTransformations === 0) {
    throw new Error('No transformations found in trajectory file');
  }

  const transformations = readTransformationsFromContent(trajContent, numTransformations, txt);
  const allAtoms = [];

  transformations.forEach(([tr, xr], i) => {
    const chainId = CHAIN_IDS[i % CHAIN_IDS.length];
    const transformed = applyTransformation(templateAtoms, tr, xr);
    transformed.forEach(atom => atom.chain_id = chainId);
    allAtoms.push(...transformed);
  });

  if (exyz) {
    return writeExyz(allAtoms);
  } else {
    return allAtoms.map(atom => atom.toPdbLine(atom.chain_id) + '\n').join('') + 'END\n';
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node maeppi_traj2pdb.js template.pdb trj [--onlyCA] [--exyz] [--txt]');
    process.exit(1);
  }

  const template = args[0];
  const traj = args[1];
  const options = {
    onlyCA: args.includes('--onlyCA'),
    exyz: args.includes('--exyz'),
    txt: args.includes('--txt')
  };

  try {
    const templateContent = fs.readFileSync(template, 'utf8');
    const trajContent = fs.readFileSync(traj, 'utf8');
    const result = traj2pdb(templateContent, trajContent, options);
    process.stdout.write(result);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { traj2pdb, Atom, eulerToRot, applyTransformation };
}
