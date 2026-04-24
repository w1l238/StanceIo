# StanceIo

> An interactive 3D car viewing and customization experience built with React and Vite.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Model Details](#model-details)
- [Tech Stack](#tech-stack)
- [For Developers: Getting Started](#for-developers-getting-started)
- [Contributing](#contributing)

---

## Overview

**StanceIo** is a web-based application that brings car customization to the browser. Currently featuring a highly detailed 3D model of a Toyota GR86, the project maps out specific 3D object nodes and hierarchies to allow granular interaction and customization of different car parts—ranging from body panels and wheels to interior stitching.

## Features

- 🏎️ **Detailed 3D Rendering**: High-quality 3D rendering of car models directly in the browser.
- 🔧 **Granular Part Control**: The model is split into specific sub-objects (e.g., Front Bumper, Hood, Wheels, Interior) allowing for deep programmatic customization.
- ⚡ **Fast & Responsive**: Built on top of Vite and React for a lightning-fast development and user experience.

---

## Model Details

The current focal point of the application is the **GR86 Model**. The 3D model's geometry and materials have been carefully mapped out to interact with specific physical components:

- **Body**: Includes front/rear bumpers, quarter panels, doors, side skirts, roof, and detailed light setups (headlights, brake lights, reverse lights).
- **Wheels**: Individually controllable front and rear, driver and passenger side wheels.
- **Windows & Interior**: Covers windshields, side windows, and interior details like stitching, pedals, and racing stripes.

*See `gr86_model_details.md` and `gr86_model_hierachy.md` for the full breakdown of object numbers and the GLTF/FBX scene graph hierarchy.*

---

## Tech Stack

- **Frontend Framework**: React
- **Build Tool**: Vite
- **State Management**: Zustand
- **3D Rendering**: Built to handle `.fbx` and GLTF scene hierarchies (likely leveraging Three.js / React Three Fiber).

---

## For Developers: Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development.

### Prerequisites

* Node.js (v18+)
* npm, yarn, or pnpm

### Installation & Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/w1l238/StanceIo
   ```
2. Navigate to the project directory:
   ```bash
   cd StanceIo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   make run
   ```
   Open your browser and visit `http://localhost:5173`.

5. To close the development server:
    ```bash
    make stop
    ```