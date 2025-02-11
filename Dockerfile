# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies with --legacy-peer-deps.
RUN npm install --legacy-peer-deps

# Copy application code.
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the Next.js development server
CMD ["npm", "run", "dev"]
