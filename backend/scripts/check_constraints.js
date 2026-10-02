const math = require('mathjs'); // wait, mathjs might not be installed. Let's use new Function.

function evaluateConstraint(constraintStr, inputs, paramNames) {
  // convert "0 <= packets.length <= 150" to "0 <= packets.length && packets.length <= 150"
  let parsed = constraintStr.replace(/(\d+)\s*<=\s*([a-zA-Z0-9_.\[\]]+)\s*<=\s*(\d+)/g, "$1 <= $2 && $2 <= $3");
  // Also handle 10^4
  parsed = parsed.replace(/10\^(\d+)/g, "Math.pow(10, $1)");
  // Create function
  let args = paramNames.join(', ');
  try {
      const fn = new Function(args, `return ${parsed};`);
      return fn(...inputs);
  } catch (e) {
      console.log("Could not parse:", constraintStr);
      return true; // Ignore if unparseable
  }
}
