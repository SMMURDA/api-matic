# Gunakan image Node.js 18 LTS
FROM node:18

# Set working directory
WORKDIR /app

# Salin file package.json dan install dependensi
COPY package*.json ./
RUN npm install

# Salin semua file project ke dalam container
COPY . .

# Expose port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "server.js"]
