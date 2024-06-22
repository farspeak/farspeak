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

if (!options.action || !options.query) {
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
const data = YAML.load(actionFilePath);

// Check if the data structure is correct
if (!data || !Array.isArray(data.parameters)) {
  console.error('Error: The YAML file should contain an array of parameters.');
  process.exit(1);
}

const outputPath = path.resolve(__dirname, 'output.pdf');
const contents = [];

// Function to scrape website and return content using OpenAI
async function scrapeWebsite(url, prompt) {
  try {
    // Use OpenAI to process the scraped content based on the prompt
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ "role": "user", "content": prompt }],
    });

    const messageContent = chatCompletion.choices[0].message.content;
    console.log(messageContent);

    return messageContent;
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
  const initialQuery = options.query;

  for (const parameter of data.parameters) {
    const { action, details, prompts, sources } = parameter;

    // Validate the structure
    if (!Array.isArray(prompts) || !Array.isArray(sources)) {
      console.error('Error: "prompts" and "sources" should be arrays.');
      continue;
    }

    // Concatenate sources into a single string
    const sourcesString = sources.join(', ');

    // Generate a single query based on each prompt with all sources concatenated
    for (const prompt of prompts) {
      const query = `${initialQuery} ${prompt} (Action: ${action}, Details: ${details.join(', ')}. Sources: ${sourcesString})`;
      //console.log(`Query: ${query}`);
      const content = await scrapeWebsite(sources[0], query); // Use the first source for the scrapeWebsite call
      if (content) {
        contents.push(content);
      }
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

  //console.log(doc);
  console.log(entity);

  if (options.query) {
    farspeak
      .entity(entityName)
      .inquire(options.query)
      .then(console.log);
  }
})();
