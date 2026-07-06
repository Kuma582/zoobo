FROM node:18-alpine

# Set working directory to the backend folder inside the container
WORKDIR /app/backend

# Copy package.json and package-lock.json first to cache dependencies
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy all the backend files to the container
COPY backend/ .

# Expose the port (Render or other platforms will use this)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
