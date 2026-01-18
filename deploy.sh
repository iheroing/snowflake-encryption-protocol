#!/bin/bash

echo "❄️  雪花加密协议 - 部署脚本"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否已经添加远程仓库
if git remote | grep -q "origin"; then
    echo -e "${GREEN}✓${NC} 远程仓库已配置"
    git remote -v
else
    echo -e "${YELLOW}!${NC} 未检测到远程仓库"
    echo ""
    echo "请先在 GitHub 创建仓库，然后运行："
    echo -e "${BLUE}git remote add origin https://github.com/YOUR_USERNAME/snowflake-encryption-protocol.git${NC}"
    echo ""
    echo "或者手动输入远程仓库地址："
    read -p "GitHub 仓库地址: " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo -e "${GREEN}✓${NC} 远程仓库已添加"
    else
        echo -e "${RED}✗${NC} 未添加远程仓库，退出"
        exit 1
    fi
fi

echo ""
echo "================================================"
echo "📦 准备推送代码到 GitHub..."
echo "================================================"
echo ""

# 确认推送
read -p "确认推送到 GitHub? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 推送代码
    echo -e "${BLUE}→${NC} 推送代码..."
    git branch -M main
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓${NC} 代码已成功推送到 GitHub！"
        echo ""
        echo "================================================"
        echo "🌐 接下来部署到 Vercel"
        echo "================================================"
        echo ""
        echo "方式一：通过 Vercel 网站（推荐）"
        echo "  1. 访问 https://vercel.com"
        echo "  2. 使用 GitHub 登录"
        echo "  3. 点击 'Add New...' → 'Project'"
        echo "  4. 选择 'snowflake-encryption-protocol'"
        echo "  5. 点击 'Deploy'"
        echo ""
        echo "方式二：通过 Vercel CLI"
        echo "  1. 安装: npm install -g vercel"
        echo "  2. 登录: vercel login"
        echo "  3. 部署: vercel --prod"
        echo ""
        echo "================================================"
        echo ""
        
        # 询问是否使用 Vercel CLI
        read -p "是否使用 Vercel CLI 部署? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # 检查是否安装了 Vercel CLI
            if command -v vercel &> /dev/null; then
                echo -e "${GREEN}✓${NC} Vercel CLI 已安装"
                echo ""
                echo -e "${BLUE}→${NC} 开始部署..."
                vercel --prod
            else
                echo -e "${YELLOW}!${NC} Vercel CLI 未安装"
                echo ""
                read -p "是否现在安装? (y/n) " -n 1 -r
                echo ""
                
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo -e "${BLUE}→${NC} 安装 Vercel CLI..."
                    npm install -g vercel
                    
                    if [ $? -eq 0 ]; then
                        echo -e "${GREEN}✓${NC} Vercel CLI 安装成功"
                        echo ""
                        echo -e "${BLUE}→${NC} 开始部署..."
                        vercel --prod
                    else
                        echo -e "${RED}✗${NC} Vercel CLI 安装失败"
                        echo "请手动安装: npm install -g vercel"
                    fi
                else
                    echo "请访问 https://vercel.com 手动部署"
                fi
            fi
        else
            echo "请访问 https://vercel.com 手动部署"
        fi
        
        echo ""
        echo "================================================"
        echo -e "${GREEN}🎉 部署流程完成！${NC}"
        echo "================================================"
        echo ""
        echo "📚 查看完整文档: 部署指南.md"
        echo "🚀 快速开始: 立即开始.md"
        echo ""
        
    else
        echo ""
        echo -e "${RED}✗${NC} 推送失败"
        echo ""
        echo "可能的原因："
        echo "  1. 远程仓库地址错误"
        echo "  2. 没有推送权限"
        echo "  3. 网络连接问题"
        echo ""
        echo "请检查后重试，或查看 部署指南.md"
    fi
else
    echo "取消推送"
fi

echo ""
echo "================================================"
