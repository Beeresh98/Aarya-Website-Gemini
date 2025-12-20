import React, { useState, useMemo } from "react";

// Smart Silage Film Calculator - Single File React App Skeleton
// Uses Tailwind CSS assumptions and can be dropped into a React project.

const MACHINES = [
  {
    id: "msb500",
    name: "Cornext MSB500 AT-Pro",
    diameter: 500,
    height: 500,
    weightMin: 50,
    weightMax: 70,
    externalLayerCount: 1,
    internalLengthPerBale: 18,
    internalWidth: 520,
  },
  {
    id: "msb400",
    name: "Cornext MSB400 Mini",
    diameter: 400,
    height: 400,
    weightMin: 30,
    weightMax: 40,
    externalLayerCount: 1,
    internalLengthPerBale: 15,
    internalWidth: 520,
  },
  {
    id: "swell-mini",
    name: "S.Well Mini Round",
    diameter: 550,
    height: 520,
    weightMin: 50,
    weightMax: 65,
    externalLayerCount: 1,
    internalLengthPerBale: 20,
    internalWidth: 520,
  },
  {
    id: "kompakt-asb60",
    name: "Cornext Kompakt ASB60",
    diameter: 456,
    height: 426,
    weightMin: 60,
    weightMax: 60,
    externalLayerCount: 1,
    internalLengthPerBale: 19,
    internalWidth: 520,
  },
];

const EXTERNAL_FILMS = [
  {
    id: "signature-250",
    label: "250mm SIGNATURE (25 Micron) - Milky White",
    width: 250,
    thickness: 25,
    type: "SIGNATURE",
  },
  {
    id: "pro-250",
    label: "250mm PRO (30 Micron) - Milky White",
    width: 250,
    thickness: 30,
    type: "PRO",
  },
  {
    id: "ultra-250",
    label: "250mm ULTRA (Machine Grade 25 Micron) - Milky White",
    width: 250,
    thickness: 25,
    type: "ULTRA",
  },
];

const INTERNAL_FILMS = [
  {
    id: "int-transparent-520",
    label: "520mm Transparent (20 Micron)",
    width: 520,
    thickness: 20,
    type: "TRANSPARENT",
  },
  {
    id: "int-milky-520",
    label: "520mm Milky White (20 Micron)",
    width: 520,
    thickness: 20,
    type: "MILKY_WHITE",
  },
];

const DENSITY = 0.92; // g/cm^3
const PI = 3.14159;

function formatKg(value) {
  if (isNaN(value)) return "-";
  return value.toFixed(2);
}

function calculateResults({
  machine,
  isUnknown,
  customDiameter,
  customHeight,
  externalFilm,
  internalFilm,
  rounds,
  bales,
}) {
  if (!externalFilm || !internalFilm || (!machine && !isUnknown)) {
    return null;
  }

  const diameter = isUnknown ? Number(customDiameter) || 0 : machine.diameter;
  const height = isUnknown ? Number(customHeight) || 0 : machine.height;

  if (!diameter || !height) return null;

  const externalLayerCount = machine?.externalLayerCount || 1;

  // External film
  const filmPathPerRoundMm = PI * (diameter + height); // mm
  const totalFilmPathMm = filmPathPerRoundMm * rounds * externalLayerCount; // mm
  const externalLengthM = totalFilmPathMm / 1000; // meters

  // Convert to volume and weight
  // Thickness microns -> mm -> cm, width mm -> cm, length m -> cm
  const extThicknessCm = externalFilm.thickness * 0.0001; // micron to cm
  const extWidthCm = externalFilm.width * 0.1; // mm to cm
  const extLengthCm = externalLengthM * 100; // m to cm

  const externalVolumeCm3 = extThicknessCm * extWidthCm * extLengthCm;
  const externalWeightGPerBale = externalVolumeCm3 * DENSITY;

  // Internal film (per bale length from machine or default)
  const internalLengthPerBaleM = machine?.internalLengthPerBale || 15; // m
  const intThicknessCm = internalFilm.thickness * 0.0001;
  const intWidthCm = internalFilm.width * 0.1;
  const intLengthCm = internalLengthPerBaleM * 100;

  const internalVolumeCm3 = intThicknessCm * intWidthCm * intLengthCm;
  const internalWeightGPerBale = internalVolumeCm3 * DENSITY;

  const totalPerBaleG = externalWeightGPerBale + internalWeightGPerBale;
  const totalPerBaleKg = totalPerBaleG / 1000;

  const totalExternalKg = (externalWeightGPerBale * bales) / 1000;
  const totalInternalKg = (internalWeightGPerBale * bales) / 1000;
  const totalKg = totalPerBaleKg * bales;

  return {
    externalLengthM,
    internalLengthPerBaleM,
    externalWeightGPerBale,
    internalWeightGPerBale,
    totalPerBaleKg,
    totalExternalKg,
    totalInternalKg,
    totalKg,
  };
}

const SmartSilageFilmCalculator = () => {
  const [selectedMachineId, setSelectedMachineId] = useState("msb500");
  const [isUnknownMachine, setIsUnknownMachine] = useState(false);
  const [customDiameter, setCustomDiameter] = useState(500);
  const [customHeight, setCustomHeight] = useState(500);

  const [externalFilmId, setExternalFilmId] = useState("signature-250");
  const [internalFilmId, setInternalFilmId] = useState("int-transparent-520");

  const [rounds, setRounds] = useState(20);
  const [bales, setBales] = useState(1);

  const machine = useMemo(
    () => MACHINES.find((m) => m.id === selectedMachineId) || null,
    [selectedMachineId]
  );
  const externalFilm = useMemo(
    () => EXTERNAL_FILMS.find((f) => f.id === externalFilmId) || null,
    [externalFilmId]
  );
  const internalFilm = useMemo(
    () => INTERNAL_FILMS.find((f) => f.id === internalFilmId) || null,
    [internalFilmId]
  );

  const results = useMemo(
    () =>
      calculateResults({
        machine: isUnknownMachine ? null : machine,
        isUnknown: isUnknownMachine,
        customDiameter,
        customHeight,
        externalFilm,
        internalFilm,
        rounds: Number(rounds) || 0,
        bales: Number(bales) || 0,
      }),
    [machine, isUnknownMachine, customDiameter, customHeight, externalFilm, internalFilm, rounds, bales]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F5E1] to-[#F8F9FA] text-[#2C3E50]">
      <header className="border-b border-[#E9ECEF] bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-bold text-lg">
              SF
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Smart Silage Film Calculator
              </h1>
              <p className="text-sm text-[#6C757D]">
                Calculate your silage film requirements instantly.
              </p>
            </div>
          </div>
          <button className="hidden sm:inline-flex px-4 py-2 rounded-full bg-[#2D5016] text-white text-sm font-medium shadow-md hover:bg-[#4A7C28] transition">
            Get Your Free Calculation
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6">
        {/* Left: Inputs */}
        <div className="flex-1 space-y-6">
          {/* Machine Selection Card */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-[#E9ECEF]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">1. Choose Your Machine</h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUnknownMachine}
                  onChange={(e) => setIsUnknownMachine(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>My machine isn&apos;t listed</span>
              </label>
            </div>

            {!isUnknownMachine ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {MACHINES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMachineId(m.id)}
                    className={`text-left p-4 rounded-xl border transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4A7C28] ${
                      selectedMachineId === m.id
                        ? "border-[#2D5016] bg-[#E8F5E1]"
                        : "border-[#E9ECEF] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {m.name}
                      </h3>
                      {selectedMachineId === m.id && (
                        <span className="text-xs px-2 py-1 rounded-full bg-[#2D5016] text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-[#6C757D] space-y-1">
                      <p>
                        Bale Size: {m.diameter}×{m.height} mm
                      </p>
                      <p>
                        Bale Weight: {m.weightMin}-{m.weightMax} kg
                      </p>
                      <p>External Layers: {m.externalLayerCount} layer(s)</p>
                      <p>Internal Film: ~{m.internalLengthPerBale} m/bale</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bale Diameter (mm)
                  </label>
                  <input
                    type="number"
                    value={customDiameter}
                    onChange={(e) => setCustomDiameter(e.target.value)}
                    className="w-full rounded-lg border border-[#E9ECEF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C28]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bale Height (mm)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full rounded-lg border border-[#E9ECEF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C28]"
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-[#6C757D] bg-[#F8F9FA] rounded-lg p-3">
                  These calculations are estimates when using a custom machine.
                  Actual usage may vary.
                </p>
              </div>
            )}
          </section>

          {/* External Film Card */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-[#E9ECEF]">
            <h2 className="text-lg font-semibold mb-4">2. External Film</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {EXTERNAL_FILMS.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => setExternalFilmId(film.id)}
                  className={`text-left p-4 rounded-xl border transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4A7C28] ${
                    externalFilmId === film.id
                      ? "border-[#1D3557] bg-[#E8F5E1]"
                      : "border-[#E9ECEF] bg-white"
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">{film.type}</p>
                  <p className="text-xs text-[#6C757D] mb-2">{film.label}</p>
                  <div className="text-xs text-[#6C757D] space-y-1">
                    <p>Width: {film.width} mm</p>
                    <p>Thickness: {film.thickness} µ</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Internal Film Card */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-[#E9ECEF]">
            <h2 className="text-lg font-semibold mb-4">3. Internal Film</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {INTERNAL_FILMS.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => setInternalFilmId(film.id)}
                  className={`text-left p-4 rounded-xl border transition shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#4A7C28] ${
                    internalFilmId === film.id
                      ? "border-[#457B9D] bg-[#E8F5E1]"
                      : "border-[#E9ECEF] bg-white"
                  }`}
                >
                  <p className="font-semibold text-sm mb-1">{film.type}</p>
                  <p className="text-xs text-[#6C757D] mb-2">{film.label}</p>
                  <div className="text-xs text-[#6C757D] space-y-1">
                    <p>Width: {film.width} mm</p>
                    <p>Thickness: {film.thickness} µ</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Wrapping & Bales */}
          <section className="bg-white rounded-2xl shadow-sm p-6 border border-[#E9ECEF]">
            <h2 className="text-lg font-semibold mb-4">
              4. Wrapping Configuration
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Wrapping Rounds
                  </label>
                  <span className="text-xs text-[#6C757D]">
                    Common: Light 12–16 | Standard 18–22 | Heavy 24–28
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={10}
                    max={30}
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full"
                  />
                  <input
                    type="number"
                    min={10}
                    max={30}
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-20 rounded-lg border border-[#E9ECEF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C28]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Number of Bales
                  </label>
                  <span className="text-xs text-[#6C757D]">
                    Up to 10,000 bales
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={bales}
                  onChange={(e) => setBales(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E9ECEF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A7C28]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Results */}
        <aside className="w-full lg:w-80 xl:w-96 lg:sticky lg:top-6 h-fit">
          <div className="bg-[#2D5016] text-white rounded-2xl shadow-lg p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-1">Your Film Requirement</h2>
            <p className="text-xs text-[#E8F5E1] mb-2">
              Based on your current configuration. Results are estimates and may
              vary 5–15% in real-world conditions.
            </p>

            <div className="bg-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <p className="text-xs uppercase tracking-wide text-[#E8F5E1] mb-1">
                Total Film Required
              </p>
              <p className="text-4xl font-bold">
                {results ? formatKg(results.totalKg) : "-"} <span className="text-base font-medium">kg</span>
              </p>
              <p className="text-xs text-[#E8F5E1] mt-1">
                Per Bale: {results ? formatKg(results.totalPerBaleKg) : "-"} kg
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-[#E8F5E1] mb-1">External Film</p>
                <p className="text-lg font-semibold">
                  {results ? formatKg(results.totalExternalKg) : "-"} kg
                </p>
                <p className="text-[11px] text-[#E8F5E1] mt-1">
                  Length: {results ? results.externalLengthM.toFixed(1) : "-"} m
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-xs text-[#E8F5E1] mb-1">Internal Film</p>
                <p className="text-lg font-semibold">
                  {results ? formatKg(results.totalInternalKg) : "-"} kg
                </p>
                <p className="text-[11px] text-[#E8F5E1] mt-1">
                  ~{results ? results.internalLengthPerBaleM : "-"} m/bale
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-white/5 rounded-xl p-3">
              <p className="font-semibold text-[#E8F5E1]">Details</p>
              <ul className="space-y-1 text-[#E8F5E1]">
                <li>
                  Machine: {isUnknownMachine ? "Custom Machine" : machine?.name || "-"}
                </li>
                <li>Rounds: {rounds}</li>
                <li>Bales: {bales}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button className="w-full px-4 py-2.5 rounded-full bg-white text-[#2D5016] text-sm font-semibold shadow hover:bg-[#E8F5E1] transition">
                Download PDF Report
              </button>
              <button className="w-full px-4 py-2.5 rounded-full border border-white/60 text-white text-sm font-semibold hover:bg-white/10 transition">
                Request Quote
              </button>
            </div>

            <p className="text-[10px] text-[#E8F5E1]/80 mt-1">
              Disclaimer: Results are estimates based on standard wrapping
              conditions. Actual usage may vary by 5–15% depending on operator
              settings, silage moisture, and machine maintenance.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default SmartSilageFilmCalculator;
