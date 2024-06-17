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

import OpenAI from 'openai';


// Farspeak setup
const program = new Command();
program
  .option('--action <path>', 'Path to the YAML file containing the action instructions')
  .option('--query <string>', 'Query to inquire from Farspeak')
  .parse(process.argv);

const options = program.opts();

if (!options.action) {
  console.error('Error: --action <farspeak.yaml> and --query are both required');
  process.exit(1);
}

// Farspeak setup
const farspeak = new Farspeak({
  app: 'test2', // your app name
  env: 'dev', // your app env
  backendToken: 'sa79iett7le564', // paste your backend token
});

const entityName = 'insights';

// OpenAI setup
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

// Get the current file path and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the action instructions from the YAML file
const actionFilePath = path.resolve(__dirname, options.action);
const { report, parameters } = YAML.load(actionFilePath);

// Function to scrape website and return content using OpenAI
async function scrapeWebsite(url, prompt) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Scrape the content (simplified example)
    const scrapedContent = await page.evaluate(() => document.body.innerText);

    // Use OpenAI to process the scraped content based on the prompt
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}\n\nContent:\n${scrapedContent}`,
      max_tokens: 500,
    });

    await browser.close();
    return response.data.choices[0].text.trim();
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
      const content = await scrapeWebsite(source, parameter.prompt);
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

  if (options.query) {
    farspeak
      .entity(entityName)
      .inquire(options.query)
      .then(console.log);
  }
})();
