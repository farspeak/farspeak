# Template to Worfklows / Reports

Welcome to Template to Worfklows / Reports.
This repository allows you to easily transform structured YAML files into a comprehensive knowledge base using web scrapers and tools, then store this data in MongoDB Atlas. With the Farspeak NPM package, you can build applications quickly and efficiently.

## Features
* YAML Parsing: Convert detailed YAML files into actionable data.
* Web Scraping: Use scrapers to gather information from specified sources.
* Knowledge Base Generation: Store and manage your insight data in MongoDB Atlas (other databases are coming!)
* Farspeak NPM: A robust package for JavaScript and TypeScript developers to build smart apps.
  
## Getting Started

### Prerequisites
* Node.js (v14.x or later)
* MongoDB Atlas account
* NPM (v6.x or later)

### Installation
* Clone the Repository
* Install Dependencies
* Get MongoDB Atlas connection string
* Create farspeak.yaml. Here is an example:

```
Report:
  Product: 
    - name: Product XYZ
      category: Electronics
Parameters:
  - name: Product Specifications
    details:
      - Technical Specifications
        - Dimensions
        - Weight
        - Battery Life
        - Processor
        - Memory
        - Storage
      - Features
        - Unique Selling Points
        - Special Functions
        - Supported Formats
    prompts:
      - "What are the technical specifications of Product XYZ?"
      - "List the unique features of Product XYZ."
    sources:
      - https://www.productwebsite.com
      - https://www.techradar.com
```
* Create an app on farspeak.ai and get your FARSPEAK_API_KEY. 
* Run farspeak-action.js (you need to get your FARSPEAK_API_KEY from farspeak.ai)

```
./farspeak-action.js --action <ANY YAML TEMPLATE> --token FARSPEAK_API_KEY

Example: 
./farspeak-action.js --action templates/farspeak.product.yaml --token FARSPEAK_API_KEY
```
You can find many templates in the templates/ directory.

* Build your smart app. Here's an example: https://github.com/farspeak/nextjs-example

# Contributing
We welcome contributions! Please read our contributing guidelines for more details.

# License
This project is licensed under the MIT License - see the LICENSE file for details.

# Acknowledgments
Thanks to all contributors and the open-source community.
Special thanks to the developers of the libraries and tools used in this project.
Contact
For questions or support, please open an issue or contact us at support@farspeak.ai.

Happy coding!

The Farspeak Team
