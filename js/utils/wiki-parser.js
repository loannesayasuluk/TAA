// TAA Archives - Wiki Parser
// 위키 링크 파싱 및 마크다운 변환

class WikiParser {
    constructor() {
        this.existingPages = new Set();
        this.linkPattern = /\[\[([^\]]+)\]\]/g;
        this.headingPattern = /^(#{1,6})\s+(.+)$/gm;
        this.boldPattern = /\*\*(.+?)\*\*/g;
        this.italicPattern = /\*(.+?)\*/g;
        this.codePattern = /`(.+?)`/g;
        this.codeBlockPattern = /```([\s\S]*?)```/g;
        this.listPattern = /^(\s*)[*+-]\s+(.+)$/gm;
        this.numberedListPattern = /^(\s*)\d+\.\s+(.+)$/gm;
        this.blockquotePattern = /^>\s+(.+)$/gm;
        this.linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    }

    // 위키 링크 파싱
    parseWikiLinks(text) {
        return text.replace(this.linkPattern, (match, linkText) => {
            const pageExists = this.existingPages.has(linkText.trim());
            const className = pageExists ? 'wiki-link' : 'wiki-link broken';
            const tooltip = pageExists ? `View: ${linkText}` : `Create: ${linkText}`;
            
            return `<a href="#" class="${className}" data-page="${linkText.trim()}" data-tooltip="${tooltip}">${linkText}</a>`;
        });
    }

    // 마크다운을 HTML로 변환
    parseMarkdown(text) {
        let html = text;

        // 코드 블록 처리
        html = html.replace(this.codeBlockPattern, (match, code) => {
            return `<pre><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // 인라인 코드 처리
        html = html.replace(this.codePattern, (match, code) => {
            return `<code>${this.escapeHtml(code)}</code>`;
        });

        // 굵은 글씨 처리
        html = html.replace(this.boldPattern, '<strong>$1</strong>');

        // 기울임꼴 처리
        html = html.replace(this.italicPattern, '<em>$1</em>');

        // 인용구 처리
        html = html.replace(this.blockquotePattern, '<blockquote>$1</blockquote>');

        // 번호 없는 목록 처리
        html = html.replace(this.listPattern, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            const padding = '  '.repeat(level);
            return `${padding}<li>${content}</li>`;
        });

        // 번호 있는 목록 처리
        html = html.replace(this.numberedListPattern, (match, indent, content) => {
            const level = Math.floor(indent.length / 2);
            const padding = '  '.repeat(level);
            return `${padding}<li>${content}</li>`;
        });

        // 목록 래핑
        html = this.wrapLists(html);

        // 위키 링크 처리
        html = this.parseWikiLinks(html);

        // 줄바꿈 처리
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // 목록 래핑
    wrapLists(html) {
        // 번호 없는 목록 래핑
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            if (match.includes('<ul>') || match.includes('</ul>')) {
                return match;
            }
            return `<ul>${match}</ul>`;
        });

        // 번호 있는 목록 래핑
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            if (match.includes('<ol>') || match.includes('</ol>')) {
                return match;
            }
            return `<ol>${match}</ol>`;
        });

        return html;
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 제목 추출
    extractHeadings(text) {
        const headings = [];
        const matches = text.matchAll(this.headingPattern);
        
        for (const match of matches) {
            const level = match[1].length;
            const title = match[2].trim();
            const id = this.generateHeadingId(title);
            
            headings.push({
                level,
                title,
                id
            });
        }
        
        return headings;
    }

    // 제목 ID 생성
    generateHeadingId(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    // 목차 생성
    generateTableOfContents(headings) {
        if (headings.length === 0) return '';

        let toc = '<h3>TABLE OF CONTENTS</h3><ul>';
        
        headings.forEach(heading => {
            const indent = '  '.repeat(heading.level - 1);
            toc += `${indent}<li><a href="#${heading.id}">${heading.title}</a></li>`;
        });
        
        toc += '</ul>';
        return toc;
    }

    // 제목에 ID 추가
    addHeadingIds(html, headings) {
        headings.forEach(heading => {
            const headingRegex = new RegExp(`<h${heading.level}>${heading.title}</h${heading.level}>`, 'i');
            html = html.replace(headingRegex, `<h${heading.level} id="${heading.id}">${heading.title}</h${heading.level}>`);
        });
        
        return html;
    }

    // 위키 링크 추출
    extractWikiLinks(text) {
        const links = [];
        const matches = text.matchAll(this.linkPattern);
        
        for (const match of matches) {
            links.push(match[1].trim());
        }
        
        return [...new Set(links)]; // 중복 제거
    }

    // 금지어 검사
    checkForbiddenWords(text) {
        const forbiddenWords = [
            '비밀', '기밀', '국가기밀', '군사기밀', '정치', '정부', '대통령',
            'secret', 'classified', 'confidential', 'top secret', 'government',
            'military', 'intelligence', 'spy', 'agent', 'mission'
        ];
        
        const found = [];
        const lowerText = text.toLowerCase();
        
        forbiddenWords.forEach(word => {
            if (lowerText.includes(word.toLowerCase())) {
                found.push(word);
            }
        });
        
        return found;
    }

    // 금지어 마스킹
    maskForbiddenWords(text) {
        const forbiddenWords = this.checkForbiddenWords(text);
        let maskedText = text;
        
        forbiddenWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            maskedText = maskedText.replace(regex, '[데이터 말소]');
        });
        
        return maskedText;
    }

    // 텍스트 미리보기 생성
    generatePreview(text, maxLength = 200) {
        // 마크다운 태그 제거
        let preview = text
            .replace(this.linkPattern, '$1')
            .replace(this.boldPattern, '$1')
            .replace(this.italicPattern, '$1')
            .replace(this.codePattern, '$1')
            .replace(this.headingPattern, '$2')
            .replace(/[#*`]/g, '')
            .trim();
        
        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength) + '...';
        }
        
        return preview;
    }

    // 키워드 추출
    extractKeywords(text, maxKeywords = 10) {
        // 일반적인 불용어 제거
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers',
            'ours', 'theirs', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
        ]);
        
        // 텍스트 정리
        const cleanText = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // 단어 분리 및 빈도 계산
        const words = cleanText.split(' ');
        const wordFreq = {};
        
        words.forEach(word => {
            if (word.length > 2 && !stopWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        // 빈도순 정렬
        const sortedWords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, maxKeywords)
            .map(([word]) => word);
        
        return sortedWords;
    }

    // 텍스트 통계 생성
    generateTextStats(text) {
        const words = text.trim().split(/\s+/).length;
        const characters = text.length;
        const lines = text.split('\n').length;
        const paragraphs = text.split(/\n\s*\n/).length;
        const headings = (text.match(this.headingPattern) || []).length;
        const links = (text.match(this.linkPattern) || []).length;
        
        return {
            words,
            characters,
            lines,
            paragraphs,
            headings,
            links
        };
    }

    // 텍스트 검색
    searchInText(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        if (lowerText.includes(lowerQuery)) {
            const index = lowerText.indexOf(lowerQuery);
            const start = Math.max(0, index - 50);
            const end = Math.min(text.length, index + query.length + 50);
            
            return {
                found: true,
                excerpt: '...' + text.substring(start, end) + '...',
                position: index
            };
        }
        
        return { found: false };
    }

    // 링크 유효성 검사
    validateLinks(text) {
        const links = this.extractWikiLinks(text);
        const validation = {
            valid: [],
            broken: [],
            total: links.length
        };
        
        links.forEach(link => {
            if (this.existingPages.has(link)) {
                validation.valid.push(link);
            } else {
                validation.broken.push(link);
            }
        });
        
        return validation;
    }

    // 텍스트 정규화
    normalizeText(text) {
        return text
            .replace(/\r\n/g, '\n') // Windows 줄바꿈을 Unix로
            .replace(/\r/g, '\n')   // Mac 줄바꿈을 Unix로
            .replace(/\t/g, '    ') // 탭을 스페이스로
            .replace(/[ \t]+$/gm, '') // 줄 끝 공백 제거
            .replace(/\n{3,}/g, '\n\n') // 연속된 줄바꿈을 2개로
            .trim();
    }

    // 기존 페이지 목록 업데이트
    updateExistingPages(pages) {
        this.existingPages = new Set(pages);
    }

    // 페이지 존재 여부 확인
    pageExists(pageName) {
        return this.existingPages.has(pageName);
    }

    // 링크 제안 생성
    generateLinkSuggestions(text) {
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        const suggestions = [];
        const existingPages = Array.from(this.existingPages);
        
        words.forEach(word => {
            const matches = existingPages.filter(page => 
                page.toLowerCase().includes(word) || 
                word.includes(page.toLowerCase())
            );
            
            if (matches.length > 0) {
                suggestions.push({
                    word,
                    suggestions: matches.slice(0, 3)
                });
            }
        });
        
        return suggestions;
    }
}

// 전역 인스턴스 생성
window.wikiParser = new WikiParser();

console.log('TAA Archives: Wiki parser initialized'); 