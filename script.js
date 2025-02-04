function processFiles() {
  const fileInput = document.getElementById("fileInput");
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = ""; // Clear previous content

  if (fileInput.files.length === 0) {
    alert("Please select at least one Excel file.");
    return;
  }

  Array.from(fileInput.files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        displayData(jsonData, file.name);
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

const getAvg = (arr) =>
  Math.floor(arr.reduce((curr, acc) => curr + acc, 0) / arr.length);

function displayData(data, fileName) {
  const outputDiv = document.getElementById("output");

  if (data.length < 2) {
    outputDiv.innerHTML += `<p>No valid data found in ${fileName}</p>`;
    return;
  }

  let fileSection = document.createElement("div");
  fileSection.classList.add("file-section");
  fileSection.innerHTML = `<h2>${fileName}</h2>`;

  const headers = data[0]; // First row as headers

  // Pricing Summary

  const allPricings = {
    basic: [],
    standard: [],
    premium: [],
  };

  for (let i = 1; i < data.length; i++) {
    const packageEntry = data[i][2];
    if (packageEntry.length < 3) continue;
    const packagesObjects = parsePricingData(packageEntry);

    allPricings.basic.push(packagesObjects[0].Price);
    allPricings.standard.push(packagesObjects[1].Price);
    allPricings.premium.push(packagesObjects[2].Price);
  }

  allPricings.basic.sort((a, b) => a - b);
  allPricings.standard.sort((a, b) => a - b);
  allPricings.premium.sort((a, b) => a - b);

  const basic_lowest = allPricings.basic.at(0);
  const basic_highest = allPricings.basic.at(-1);
  const basic_avg = getAvg(allPricings.basic);

  const standard_lowest = allPricings.standard.at(0);
  const standard_highest = allPricings.standard.at(-1);
  const standard_avg = getAvg(allPricings.standard);

  const premium_lowest = allPricings.premium.at(0);
  const premium_highest = allPricings.premium.at(-1);
  const premium_avg = getAvg(allPricings.premium);

  const htmlForPricingSummary = `
  <div class="pricing-report">
    <h1>Pricing Report</h1>
    <h2>Basic Pricing</h2>
    <ul>
      <li>Lowest Price: $ ${basic_lowest}</li>
      <li>Highest Price: $ ${basic_highest}</li>
      <li>Average Price: $ ${basic_avg}</li>
    </ul>

    <h2>Standard Pricing</h2>
    <ul>
      <li>Lowest Price: $ ${standard_lowest}</li>
      <li>Highest Price: $ ${standard_highest}</li>
      <li>Average Price: $ ${standard_avg}</li>
    </ul>

    <h2>Premium Pricing</h2>
    <ul>
      <li>Lowest Price: $ ${premium_lowest}</li>
      <li>Highest Price: $ ${premium_highest}</li>
      <li>Average Price: $ ${premium_avg}</li>
    </ul>
  </div>
`;

  fileSection.innerHTML += htmlForPricingSummary;

  for (let i = 1; i < data.length; i++) {
    const entry = data[i];

    let dataCard = document.createElement("div");
    dataCard.classList.add("data-card");

    let packages = formatPackages(entry[2]); // Convert package data to structured format
    let faqs = formatFAQs(entry[3]); // Convert FAQs to collapsible sections

    dataCard.innerHTML = `
          <strong>${i} Title:</strong> ${entry[0] || "N/A"} <br><br>
          <strong>Description:</strong> <br>${
            entry[1] || "No description available"
          } <br><br>
          <strong>Packages:</strong> <br><br>
          <div class="packages">${packages}</div><br><br>
          <strong>FAQs:</strong><br><br>
          <div class="faqs">${faqs}</div><br><br>
          <div class="tags">
              ${formatTags(entry[4])}
          </div><br><br>
          <div class="stats">
              📊 Active Orders: ${entry[5] || 0} | ⭐ Seller Level: ${
      entry[6] || "N/A"
    } <br>
              📝 Reviews: ${entry[7] || 0} (⭐ ${
      entry[8] || "N/A"
    }) | 👍 Likes: ${entry[9] || 0}
          </div><br><br>
          <a href="${
            entry[10] || "#"
          }" class="link-btn" target="_blank">🔗 Visit</a>
      `;

    fileSection.appendChild(dataCard);
  }

  outputDiv.appendChild(fileSection);
}

function formatPackages(packages) {
  try {
    const packageData = parsePricingData(packages);
    return packageData
      .map(
        (p) => `
          <div class="package">
              $${p.Price} <br><br>
              <strong>${p.Title}</strong> <br><br>
              📜 ${p.Description}
          </div>
      `
      )
      .join("");
  } catch (error) {
    return "No package data available.";
  }
}

function formatFAQs(faqs) {
  try {
    const faqData = parseFAQsData(faqs);
    if (faqData.length == 0) {
      return `No FAQs for this gig!`;
    }
    return faqData
      .map(
        (f) => `
          <div class="faq" onclick="toggleFAQ(this)">🔻 ${f.Question}</div>
          <div class="faq-content">${f.Answer || "[ANSWER IS MISSING]"}</div>
      `
      )
      .join("");
  } catch (error) {
    return "No FAQs available.";
  }
}

function formatTags(tags) {
  return tags
    ? tags
        .substring(1, tags.length - 1)
        .split(",")
        .map((tag) => `<span class="tag">${tag.trim()}</span>`)
        .join(" ")
    : "";
}

function toggleFAQ(element) {
  const faqContent = element.nextElementSibling;
  faqContent.style.display =
    faqContent.style.display === "none" ? "block" : "none";
}

// function parsePricingData(dataString) {
//   const dollarPriceEl = +document.getElementById("dollarPriceEl").value;
//   const dollarPriceDivider = !isNaN(dollarPriceEl) ? dollarPriceEl : 1;

//   // Convert single quotes to double quotes and parse JSON
//   let jsonData = dataString.replace(/"/g, "");
//   jsonData.replace(/(\w+):/g, '"$1":');
//   jsonData = jsonData.replace(/'/g, '"');
//   const parsedArray = JSON.parse(jsonData);

//   // Process each item to convert price to number
//   return parsedArray.map((item) => ({
//     Type: item.Type,
//     Price: Math.floor(
//       parseInt(item.Price.replace(/PKR |,/g, ""), 10) / dollarPriceDivider
//     ),
//     Title: item.Title,
//     Description: item.Description,
//   }));
// }

// function parsePricingData(dataString) {
//   const dollarPriceEl = +document.getElementById("dollarPriceEl").value;
//   const dollarPriceDivider = !isNaN(dollarPriceEl) ? dollarPriceEl : 1;

//   // Define a regular expression pattern to match the pricing items
//   const pattern = /{'Type':\s*'(.*?)',\s*'Price':\s*'(PKR\s*\d{1,3}(?:,\d{3})*)',\s*'Title':\s*'(.*?)',\s*'Description':\s*'(.*?)'}/g;

//   const items = [];
//   let match;

//   // Use regex to match all occurrences of the pattern
//   while ((match = pattern.exec(dataString)) !== null) {
//     // Extract data from the match
//     const type = match[1]?.trim(); // The 'Type' field
//     let price = match[2]?.trim(); // The 'Price' field (with PKR)
//     const title = match[3]?.trim(); // The 'Title' field
//     const description = match[4]?.trim(); // The 'Description' field

//     // Process the price to remove 'PKR' and commas, then convert to integer
//     price = Math.floor(
//       parseInt(price.replace(/PKR\s|,/g, ""), 10) / dollarPriceDivider
//     );

//     // Add the parsed item to the items array
//     items.push({
//       Type: type,
//       Price: price,
//       Title: title,
//       Description: description,
//     });
//   }

//   return items;
// }

function parsePricingData(dataString) {
  const dollarPriceEl = +document.getElementById("dollarPriceEl").value;
  const dollarPriceDivider = !isNaN(dollarPriceEl) ? dollarPriceEl : 1;

  // Sanitize the string: Remove all single and double quotes
  dataString = dataString.replace(/['"]/g, "");

  // Clean the string by removing square brackets and extra spaces
  dataString = dataString
    .replace("[", "")
    .replace("]", "")
    .replace(/\s+/g, " ")
    .trim();

  // Split the string into separate entries (based on `}, {` which separates each item)
  const entries = dataString.split("}, {");

  const items = entries.map((entry) => {
    // Further split the entry by `,` to extract each key-value pair
    const parts = entry.split(", ");

    // Trim the parts to remove any leading/trailing spaces
    const type = parts[0].split(":")[1].trim();
    const price = parts[1].split(":")[1].trim();
    const title = parts[2].split(":")[1].trim();
    const description = parts[3].split(":")[1].trim();

    // Clean and process the price
    const numericPrice = Math.floor(
      parseInt(price.replace(/PKR\s|,/g, ""), 10) / dollarPriceDivider
    );

    // Return the cleaned-up item object
    return {
      Type: type,
      Price: numericPrice,
      Title: title,
      Description: description,
    };
  });

  return items;
}

function parseFAQsData(dataString) {
  // Convert single quotes to double quotes and parse JSON
  const jsonData = dataString.replace(/'/g, '"');
  const parsedArray = JSON.parse(jsonData);

  // Process each item to convert price to number
  return parsedArray;
}
