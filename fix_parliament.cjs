const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/pages/parliament/ParliamentPage.tsx');
let content = fs.readFileSync(file, 'utf8');

// fix activeBill type annotation
content = content.replace(
  "const activeBill: BillItem | undefined =",
  "const activeBill = "
);

// fix bill_number fallback if any
content = content.replace(/activeBill\.bill_number/g, "activeBill.displayId");

// fix bill type in map
content = content.replace(
  "sortedBills.slice(0, 4).map(bill => {",
  "sortedItems.slice(0, 4).map(bill => {"
);

content = content.replace(/sortedBills/g, "sortedItems");
content = content.replace(/visibleBills/g, "visibleItems");

fs.writeFileSync(file, content, 'utf8');
console.log('Done type fixes');
