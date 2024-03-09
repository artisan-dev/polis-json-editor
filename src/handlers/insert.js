const { REGEL_SOORTEN, SOORT_LOOKUP } = require("../constants");
const { clearView, readLine, readOne, showStatus } = require("../lib");

async function insert(internalState) {

  if (!internalState.insertAt) {
    console.error("should have internalState.insertAt");
    process.exit();
  }

  clearView();

  internalState.queuedObject = {};

  process.stdout.write("Wat is de omschrijving van de regel?\n");

  const omschrijving = await readLine();

  Object.assign(internalState.queuedObject, { omschrijving: omschrijving.trim() });
  clearView()
  showStatus(internalState.queuedObject);

  Object.keys(REGEL_SOORTEN).forEach((key) => {
    process.stdout.write(`\n${REGEL_SOORTEN[key]}: ${key}`);
  });
  process.stdout.write("\n\nWat is de soort? (default = 1)\n");

  const soort = await readOne();

  if (soort.trim().length !== 0) {
    Object.assign(internalState.queuedObject, { soort: SOORT_LOOKUP[soort.trim()] });
  } else {
    Object.assign(internalState.queuedObject, { soort: SOORT_LOOKUP["1"] });
  }

  clearView()
  showStatus(internalState.queuedObject);
  process.stdout.write("\n\nWat is de dekking? (default = geen dekking)\n");

  const dekking = await readLine();

  if (dekking.trim().length !== 0) {
    Object.assign(internalState.queuedObject, { dekking: dekking.trim() });
  }

  clearView();
  showStatus(internalState.queuedObject);
  process.stdout.write("\n\nWat is de inhoud? (default = lege inhoud)\n");

  const inhoud = await readLine();

  if (inhoud.trim().length !== 0) {
    Object.assign(internalState.queuedObject, { inhoud: inhoud.trim() });
  }

  clearView();
  showStatus(internalState.queuedObject);

  process.stdout.write("\n\nWil je condities toevoegen?\n");

  const answer = await readOne();

  if (answer.trim() === "j") {
    return 3;
  }

  return 4;
}

module.exports = {
  insert
};
