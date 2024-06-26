import { ERRNO, HANDLERS } from "../constants.js";
import { clearView, showStatus, readOne, readLine } from "../lib.js";
import chalk from "chalk";

const red = chalk.red;

export async function condities(internalState) {
  Object.assign(internalState.queuedObject, {
    condities: []
  });

  clearView();
  process.stdout.write(red("\nVoer op enig moment !R (bij teksten) of ! (bij letters) in om opnieuw te beginnen\n"));
  showStatus(internalState.queuedObject);
  process.stdout.write("\ne: EN conditie\no: OF conditie ");
  process.stdout.write("\nWelk soort conditie wil je toevoegen? (default = EN conditie)\n");

  let answer = await readOne();

  if (answer.trim() === "o") {
    internalState.queuedObject.condities.push("OF");
  } else {
    internalState.queuedObject.condities.push("EN");
  }

  while (1) {
    clearView();
    showStatus(internalState.queuedObject);
    process.stdout.write("\nm: maatschappij\n");
    process.stdout.write("l: labels\n");
    process.stdout.write("w: waardes\n");
    process.stdout.write("d: dekkingen\n");
    process.stdout.write("b: branches\n");
    process.stdout.write("o: omgedraaid\n");
    process.stdout.write("Welke eigenschappen wil je in de condities hebben?" +
      " Typ alle letters die van toepassing zijn: (default = ml)\n");

    const flags = await readLine();
    if (flags.indexOf("!R") > -1) {
      return HANDLERS.CONDITIES;
    }

    if (flags.trim().length === 0) {
      const errno = await maakConditie("ml", internalState);
      if (errno === ERRNO.BADCOND) {
        return HANDLERS.CONDITIES;
      }
    } else {
      const errno = await maakConditie(flags.trim(), internalState);
      if (errno === ERRNO.BADCOND) {
        return HANDLERS.CONDITIES;
      }
    }

    clearView();
    showStatus(internalState.queuedObject);
    process.stdout.write("\nj: ja ik wil meer condities toevoegen");
    process.stdout.write("\nn: nee ik wil geen condities meer toevoegen");
    process.stdout.write("\nWil je meer condities toevoegen? (default = n)\n");

    let answer = await readOne();
    if (answer.indexOf("!") > -1) {
      return HANDLERS.CONDITIES;
    }

    if (answer.trim() !== "j") {
      break;
    }
  }

  return HANDLERS.CACHE;
}

async function maakConditie(flags, internalState) {
  const conditieObj = {};

  if (flags.indexOf("m") > -1) {
    clearView();
    showStatus(conditieObj);
    process.stdout.write("\nWelke maatschappijen wil je toevoegen aan deze " +
      "conditie? Gebruik een spatie om ze te scheiden. (Voorbeeld: P302 P353 P380)\n");

    let answer = await readLine();
    if (answer.indexOf("!R") > -1) {
      return ERRNO.BADCOND;
    }

    Object.assign(conditieObj, {
      maatschappijen: answer.trim().split(" ")
    });
  }

  if (flags.indexOf("d") > -1) {
    clearView();
    showStatus(conditieObj);
    process.stdout.write("\nWelke dekkingen wil je toevoegen aan deze " +
      "conditie? Gebruik een spatie om ze te scheiden. (Voorbeeld: 02030 02031)\n");

    let answer = await readLine();
    if (answer.indexOf("!R") > -1) {
      return ERRNO.BADCOND;
    }

    Object.assign(conditieObj, {
      dekkingen: answer.trim().split(" ")
    });
  }

  if (flags.indexOf("b") > -1) {
    clearView();
    showStatus(conditieObj);
    process.stdout.write("\nWelke branches wil je toevoegen aan deze " +
      "conditie? Gebruik een spatie om ze te scheiden. (Voorbeeld: 01010 01100)\n");

    let answer = await readLine();
    if (answer.indexOf("!R") > -1) {
      return ERRNO.BADCOND;
    }

    Object.assign(conditieObj, {
      branches: answer.trim().split(" ")
    });
  }

  if (flags.indexOf("w") > -1) {
    clearView();
    showStatus(conditieObj);
    process.stdout.write("\nWelke waardes wil je toevoegen aan deze " +
      "conditie? Gebruik een | om de waardes te scheiden. " +
      "(Voorbeeld: 0,00|Zie polisvoorwaarden|Deez nuts)\n");
    let answer = await readLine();
    if (answer.indexOf("!R") > -1) {
      return ERRNO.BADCOND;
    }
    Object.assign(conditieObj, {
      waardes: answer.trim().split("|")
    });
  }

  if (flags.indexOf("l") > -1) {
    clearView()
    showStatus(conditieObj);
    process.stdout.write("\nj: Ja ik wil de labels automatisch laten vullen");
    process.stdout.write("\nn: Nee ik wil zelf de labels invoeren");
    process.stdout.write("\nWil je zelf de labels invullen of wil je de " +
      "labels automatisch uit de omschrijving / inhoud halen?" +
      " (default = j)\n");

    let answer = await readOne();
    if (answer.indexOf("!") > -1) {
      return ERRNO.BADCOND;
    }

    if (answer.trim() === "n") {
      process.stdout.write("Ok, voer de labels in met een spatie ertussen. " +
        "(voorbeeld:10142o 10039 10001c)\n");

      let answer = await readLine();
      if (answer.indexOf("!R") > -1) {
        return ERRNO.BADCOND;
      }

      Object.assign(conditieObj, {
        labels: answer.trim().split(" ")
      });

    } else {
      Object.assign(conditieObj, {
        labels: extractLabels(internalState)
      });
    }
  }

  if (flags.indexOf("o") > -1) {
    // is alleen nuttig als het true is
    Object.assign(conditieObj, { omgedraaid: true });
  }

  clearView();
  showStatus(conditieObj);
  process.stdout.write("\nj: Ja dit conditie object is correct");
  process.stdout.write("\nn: Nee dit conditie object wil ik opnieuw doen");
  process.stdout.write("\nIs dit conditie object correct? (default = j)\n");
  let answer = await readOne();
  if (answer.indexOf("!") > -1) {
    return ERRNO.BADCOND;
  }

  if (answer.trim() === "n") {
    return maakConditie(flags, internalState);
  }

  internalState.queuedObject.condities.push(conditieObj);
}

function extractLabels(internalState) {
  const { omschrijving, inhoud } = internalState.queuedObject;
  const labels = [];

  if (typeof omschrijving === "string") {
    let ol = getlabels(omschrijving);
    labels.splice(labels.length, 0, ...ol);
  }

  if (typeof inhoud === "string") {
    let il = getlabels(inhoud);
    labels.splice(labels.length, 0, ...il);
  }

  return labels;
}

let pattern = new RegExp("[dr]?[0-9]{5}[oc]?", "g")

function getlabels(str) {
  const labels = str.match(pattern);

  if (labels === null) {
    return [];
  }

  return labels;
}
