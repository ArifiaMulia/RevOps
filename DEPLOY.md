# Deployment Guide for Prasetia RevOps Hub

This guide explains how to deploy the Prasetia RevOps Hub using Docker.

## Prerequisites

- Docker installed on your machine or server.
- Docker Compose (optional, but recommended).

## Deployment Steps

### Option 1: Using Docker Compose (Recommended)

1.  **Build and Run:**
    Open your terminal in the project root directory and run:
    ```bash
    docker-compose up -d --build
    ```
    This command builds the image and starts the container in detached mode.

2.  **Access the Application:**
    Open your browser and navigate to: `http://localhost:8080`

3.  **Stop the Application:**
    ```bash
    docker-compose down
    ```

### Option 2: Using Docker CLI Manually

1.  **Build the Image:**
    ```bash
    docker build -t prasetia-revops-hub .
    ```

2.  **Run the Container:**
    ```bash
    docker run -d -p 8080:80 --name prasetia-revops-hub prasetia-revops-hub
    ```

3.  **Access:** `http://localhost:8080`

## Configuration

- **Port:** The default mapping is port `8080` on the host to port `80` in the container. To change this, edit `docker-compose.yml` (e.g., `"3000:80"`) or the `-p` flag in the Docker run command.
- **Nginx Config:** The Nginx configuration is located in `nginx.conf`. It handles Gzip compression, caching headers for static assets, and SPA routing (redirecting 404s to `index.html` as a fallback, though HashRouter is primary).

## Troubleshooting

- **Build Failures:** Ensure you have internet access during the build process so `pnpm` can fetch dependencies.
- **Port Conflicts:** If port 8080 is already in use, change the first port number in the mapping (e.g., `8081:80`).
