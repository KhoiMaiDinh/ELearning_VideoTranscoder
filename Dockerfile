##################
# BASE IMAGE (for builds)
##################
FROM node:20-bullseye AS base


# Install npm & node-pre-gyp
RUN npm install -g node-pre-gyp husky

# Install build tools required for tfjs-node native addon compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    g++ \
    curl \
    git \
    pkg-config \
    rsync \
    unzip \
    wget \
 && rm -rf /var/lib/apt/lists/*



#############################
# DEVELOPMENT IMAGE
#############################
FROM base AS development

WORKDIR /app
RUN chown -R node:node /app

COPY --chown=node:node package*.json ./

# Install all dependencies including devDependencies
RUN npm install




# Copy full app source
COPY --chown=node:node . .

USER node


#####################
# BUILDER IMAGE
#####################
FROM base AS builder

WORKDIR /app

# Copy lock files and dependencies from development stage
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=development /app/node_modules ./node_modules
COPY --chown=node:node --from=development /app/src ./src
COPY --chown=node:node --from=development /app/tsconfig*.json ./ 
COPY --chown=node:node --from=development /app/nest-cli.json ./nest-cli.json

# Build the app
RUN npm run build

# Prune and reinstall only production dependencies
ENV NODE_ENV=production
RUN npm prune --prod && npm install --prod

# Rebuild tfjs-node native binding
RUN npm rebuild @tensorflow/tfjs-node

USER node


#####################
# PRODUCTION IMAGE
#####################
FROM node:20-bullseye AS production

WORKDIR /app

# Optional: if your app writes to src/generated at runtime
RUN mkdir -p src/generated && chown -R node:node src

# Copy production artifacts
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./

# Install sudo and Docker CLI
RUN apt-get update && apt-get install -y sudo curl && \
    curl -fsSL https://get.docker.com | sh && \
    rm -rf /var/lib/apt/lists/*

# Ensure node user is in docker group (safe fallback if it exists)
RUN usermod -aG docker node && \
    echo "node ALL=(ALL) NOPASSWD: /usr/bin/docker" >> /etc/sudoers

USER node

# Start the app
CMD ["node", "dist/main.js"]
