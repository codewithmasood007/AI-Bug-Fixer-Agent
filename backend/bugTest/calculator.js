function calculateAverage(numbers) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total / numbers.length;
}

function divide(a, b) {
  return a / b;
}

const scores = [];
console.log("Average score:", calculateAverage(scores));
console.log("Division result:", divide(10, 0));