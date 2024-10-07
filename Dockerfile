FROM node:14

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the required ports
EXPOSE 5000 8091 9091

# Command to run your application
CMD ["node", "index.js"]