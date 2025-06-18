# Use the Node.js Alpine image from Docker Hub
FROM node:alpine

# Add curl
RUN apk --no-cache add curl

# Create a new user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory
WORKDIR /usr/src/app

# Install app dependencies
# Use wildcard to ensure both package.json AND package-lock.json are considered
COPY package*.json ./
RUN NODE_ENV=production npm install --ignore-scripts

# Bundle app source
COPY . .

# Change ownership of the app directory to the new user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to the new user
USER appuser

# Your app runs on port 5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
