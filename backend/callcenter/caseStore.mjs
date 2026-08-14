import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_FILE = fileURLToPath(new URL("./data/cases.json", import.meta.url));
let writeQueue = Promise.resolve();

async function readCases() {
  try {
    const content = await readFile(DATA_FILE, "utf8");
    const cases = JSON.parse(content);
    return Array.isArray(cases) ? cases : [];
  } catch (error) {
    if (error?.code !== "ENOENT") console.error("No se pudo leer cases.json:", error.message);
    return [];
  }
}

function persist(cases) {
  writeQueue = writeQueue.then(async () => {
    await mkdir(dirname(DATA_FILE), { recursive: true });
    const temporary = `${DATA_FILE}.tmp`;
    await writeFile(temporary, `${JSON.stringify(cases, null, 2)}\n`, "utf8");
    await rename(temporary, DATA_FILE);
  });
  return writeQueue;
}

export async function createCase(caseData) {
  const cases = await readCases();
  const next = [caseData, ...cases.filter((item) => item.id !== caseData.id)];
  await persist(next);
  return caseData;
}

export async function getCases() {
  return (await readCases()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCase(id) {
  return (await readCases()).find((item) => item.id === id);
}

export async function updateCase(id, patch) {
  const cases = await readCases();
  let updated;
  const next = cases.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  if (!updated) return undefined;
  await persist(next);
  return updated;
}
