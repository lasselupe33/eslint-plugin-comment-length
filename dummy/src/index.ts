// Her er en root comment som så fint beskriver "foo". wekfjwefkj wefkjwekjf wef
const foo = 2;

if (foo) {
  // what about my long comment in here, is this considered a problem?? hello wo
  // Here is the next part of the comment, and i need to fix something on the
  // other line.
  console.log("hi!");

  if (2 > foo) {
    /**
     * Here is a comment that will soon be broken into several lines, neatly ind
     */
    console.log("what?");
  }
}

/** Endnu en god kommentar, som højst sandsynligt ryger på flere linjer lige */

/**
 * Og her er en lang kommentar som har flere linjers indhold.
 *
 * Lad os respektere dobbelt linjeskift, det virker til at være en rigtig god
 * Yes, det sørger vi for at respektere
 */

// Indsæt lorem her
/** Og her! */
/**
 * og her!
 */
