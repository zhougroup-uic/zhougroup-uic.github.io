# FMAPIq Pipeline - User Help

## Session Management

At the top of the interface:

- **Show session management**: Check to reveal session loading options
- **Current Session ID**: Displays your active session (auto-created if not specified)
- **Uptime**: Shows application uptime in days
- **Client ID**: Unique identifier for occupy system; edit to reclaim access
- **Occupy button**: Click to occupy/release the system (1-hour automatic timeout)

### Loading Sessions

- **Load Existing Session ID**: Enter or select a session ID to load
- **Load from Archive**: Upload a `.tgz` or `.tar.gz` archive file
- **Example session**: Use session ID "example" to create a copy of example data

---

## Stage 1: Energy Maps

Generates energy maps from a PQR file with partial charges.

### Inputs

- **PQR File**: Upload your protein structure file with partial charges
- **Ion Strength (M)**: Ionic strength in molar (default: 0.016)
- **Temperature (C)**: Temperature in Celsius (default: 25)
- **nrot**: Number of rotations - 72, 576, or 4608 (default: 72)
- **escl**: Energy scaling factor (default: 1.0)
- **vscl**: Volume scaling factor; use negative for automatic calculation based on molecular weight
- **Threads**: Number of CPU threads to use
- **Update Only**: Check to reload existing Stage 1 results without recomputing

### Output

Displays execution results including molecular weight, number of atoms, and completion status.

---

## Stage 2: Simulation

Runs Monte Carlo simulations to generate protein configurations.

### Concentration Options

- **Number of proteins**: Number of protein molecules in the simulation box
- **Box Size (Å)**: Simulation box dimension in Angstroms

**Calculated values** (displayed automatically):
- Molecular Weight (Da)
- Concentration (mg/mL)
- Concentration (mM)

### Simulation Options

- **Replicates**: Number of independent simulation replicates (default: 3)
- **Cycles**: Number of Monte Carlo cycles per replicate (default: 20000)
- **Threads per Job**: CPU threads allocated to each parallel job
- **Parallel Jobs**: Automatically calculated (Total threads / Threads per Job)
- **Update Only**: Check to reload existing Stage 2 results without recomputing

### Output

Displays simulation progress and number of configurations generated.

---

## Stage 3: Calculate I(q)

Calculates scattering intensity curves from simulation configurations.

### Inputs

- **Box Size (Å)**: Same as Stage 2
- **Spacing**: Grid spacing for scattering calculation (default: 1.0)
- **Threads**: Number of CPU threads to use
- **Update Only**: Check to reload existing Stage 3 results without recomputing

### Output

Displays number of I(q) curves calculated and processing time.

---

## Plot I(q)

Visualizes scattering intensity curves with customization options.

### Plot Options

- **Show individual curves**: Display all replicate curves (not just mean/std)
- **Show P(q) reference**: Include P(q) form factor reference line
- **Log scale (x-axis)**: Use logarithmic scale for q-axis
- **Log scale (y-axis)**: Use logarithmic scale for intensity axis
- **Q min / Q max**: Set q-range for plot
- **Y min / Y max**: Set intensity range for plot

### Output

Generates and displays the I(q) plot image.

---

## Download

### Direct File Downloads

- **Iqs.stat.txt**: Statistics file with mean and standard deviation
- **Iqs.txt**: Full I(q) data for all replicates

### Pack Work Directory

Create a compressed archive of your work directory.

- **Skip energy maps**: Exclude energy map files to reduce archive size
- **Skip raw data**: Exclude raw simulation data to reduce archive size
- **Pack Work Directory**: Generate downloadable `.tgz` archive

---

## Cleanup

Manage session directories to free disk space.

### Options

- **Days threshold**: Remove directories older than this many days (range: 7-365)
- **Calculate Size**: Preview which directories will be removed and total size
- **Cleanup**: Permanently delete old directories

**Note**: The 'example' directory is always excluded from cleanup.

---

## Tips

1. **Update Only checkbox**: Use this to reload results from a previous session without rerunning computations
2. **System occupation**: When occupied by another user, pipeline stages cannot run
3. **Session persistence**: Work directories are saved in the `sessions/` folder
4. **Example data**: Load session ID "example" to experiment with pre-computed data
