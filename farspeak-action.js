#!/usr/bin/env node

import { Farspeak } from 'farspeak';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import YAML from 'yamljs';
import { Command } from 'commander';
import puppeteer from 'puppeteer';
import fsPromises from 'fs/promises';
import PDFDocument from 'pdfkit';

// Farspeak setup
const program = new Command();
program
  .option('--action <path>', 'Path to the YAML file containing the action instructions')
  .parse(process.argv);

const options = program.opts();

if (!options.action) {
  console.error('Error: --action <farspeak.yaml> is required');
  process.exit(1);
}

// Farspeak setup
const farspeak = new Farspeak({
    app: 'test2', // your app name
    env: 'dev', // your app env
    backendToken: 'sa79iett7le564', // paste your backend token
  });

const entityName = 'insights';

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the action instructions from the YAML file
const actionFilePath = path.resolve(__dirname, options.action);
const { report, parameters } = YAML.load(actionFilePath);

// Function to scrape website and return content
async function scrapeWebsite(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Scrape the content (simplified example)
    const content = await page.evaluate(() => document.body.innerText);

    await browser.close();
    return content;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error.message}`);
  }
}

// Function to create a PDF from content
async function createPDF(contents, outputPath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputPath));

  contents.forEach(content => {
    doc.text(content, { align: 'left' });
    doc.addPage();
  });

  doc.end();
  await new Promise(resolve => doc.on('finish', resolve));
  console.log(`PDF saved to ${outputPath}`);
}

(async () => {
  const outputPath = path.resolve(__dirname, 'output.pdf');
  const contents = [];

  for (const parameter of parameters) {
    for (const source of parameter.sources) {
      const content = await scrapeWebsite(source);
      contents.push(content);
    }
  }

  // Create a PDF with the scraped contents
  await createPDF(contents, outputPath);

  // Process the PDF with Farspeak
  const doc = await farspeak
    .entity(entityName)
    .fromDocument({ filePath: outputPath });
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const entity = await farspeak.entity(entityName).get(doc.id);

  console.log(doc);
  console.log(entity);
})();
