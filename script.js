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

  for (let i = 1; i < data.length; i++) {
    const entry = data[i];

    let dataCard = document.createElement("div");
    dataCard.classList.add("data-card");    

    let packages = formatPackages(entry[2]); // Convert package data to structured format
    let faqs = formatFAQs(entry[3]); // Convert FAQs to collapsible sections

    dataCard.innerHTML = `
          <strong>Title:</strong> ${entry[0] || "N/A"} <br><br>
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
    if(faqData.length == 0) {
        return `No FAQs for this gig!`
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

function parsePricingData(dataString) {

    const dollarPriceEl = +document.getElementById('dollarPriceEl').value;
    const dollarPriceDivider = !isNaN(dollarPriceEl) ? dollarPriceEl : 1

    // Convert single quotes to double quotes and parse JSON
    const jsonData = dataString.replace(/'/g, '"');
    const parsedArray = JSON.parse(jsonData);
    
    // Process each item to convert price to number
    return parsedArray.map(item => ({
      Type: item.Type,
      Price: Math.floor(parseInt(item.Price.replace(/PKR |,/g, ''), 10) / dollarPriceDivider),
      Title: item.Title,
      Description: item.Description
    }));
  }

function parseFAQsData(dataString) {
    // Convert single quotes to double quotes and parse JSON
    const jsonData = dataString.replace(/'/g, '"');
    const parsedArray = JSON.parse(jsonData);
    
    // Process each item to convert price to number
    return parsedArray;
  }
