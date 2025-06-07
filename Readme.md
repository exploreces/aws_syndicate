# 🚀 Syndicate + AWS Project Setup Guide

## 📘 What is Syndicate?

[Syndicate](https://github.com/epam/aws-syndicate) is an open-source CLI tool designed to simplify **cloud-native development on AWS**. It helps developers create, build, deploy, and update serverless applications quickly using standardized configurations and AWS best practices.

### 🔑 Key Features
- Rapid project scaffolding
- Simplified deployment to AWS
- Built-in support for AWS Lambda, API Gateway, S3, and more
- Git-friendly structure for CI/CD pipelines

---

## ☁️ What is AWS?

**Amazon Web Services (AWS)** is a leading cloud service provider offering a broad set of infrastructure services such as compute, storage, databases, machine learning, and deployment tools.

Syndicate helps abstract many AWS complexities and lets developers focus on writing code rather than managing infrastructure directly.

---

## 🧰 Prerequisites

✅ **Syndicate CLI must be installed**

> Follow installation instructions from the official repo:  
> https://github.com/epam/aws-syndicate#installation

---
## 🛠️ Usage Guide

Run these commands step-by-step:

```bash
# 1. Generate a new project scaffold (replace yourname with your project name)
syndicate generate project --name yourname

# 2. Build the project and upload assets to S3
syndicate build

# 3. Deploy the project to AWS
syndicate deploy

# When you make changes later, rebuild and update without full redeploy:
syndicate build
syndicate update