// Notion API Configuration
const NOTION_API_TOKEN = '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';
const DATABASE_ID = '140c5a88885f80fca277d302c27e0ad0';
const DATA_SOURCE_ID = '140c5a88-885f-8163-a887-000b74a40f4f';

// Function to fetch subjects from Notion
async function fetchSubjects() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const containerEl = document.getElementById('predmety-container');

    try {
        // Show loading state
        loadingEl.style.display = 'flex';
        errorEl.style.display = 'none';
        containerEl.style.display = 'none';

        // Fetch from Notion API
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page_size: 100
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Načtená data:', data);

        // Hide loading, show content
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

        // Group subjects by ročník
        const groupedSubjects = groupByRocnik(data.results);
        
        // Render subjects
        renderSubjects(groupedSubjects, containerEl);

    } catch (error) {
        console.error('Chyba při načítání předmětů:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    }
}

// Function to extract plain text from rich text
function getPlainText(richTextArray) {
    if (!richTextArray || !Array.isArray(richTextArray)) return '';
    return richTextArray.map(item => item.plain_text || '').join('');
}

// Function to get status label
function getStatusLabel(status) {
    const statusMap = {
        'Ukončeno': 'Ukončeno',
        'Probíhá': 'Probíhá',
        'Not started': 'Nezačato'
    };
    return statusMap[status] || status;
}

// Function to get status class
function getStatusClass(status) {
    const classMap = {
        'Ukončeno': 'status-ukonceno',
        'Probíhá': 'status-probiha',
        'Not started': 'status-not-started'
    };
    return classMap[status] || 'status-not-started';
}

// Group subjects by ročník
function groupByRocnik(subjects) {
    const groups = {};
    
    subjects.forEach(subject => {
        const rocnik = subject.properties['Ročník']?.select?.name || 'Bez ročníku';
        
        if (!groups[rocnik]) {
            groups[rocnik] = [];
        }
        
        groups[rocnik].push(subject);
    });
    
    // Sort groups by ročník order
    const sortedGroups = {};
    const order = ['1. roč. | 1. sem.', '1. roč. | 2. sem.', '2. roč. | 3. sem.'];
    
    order.forEach(key => {
        if (groups[key]) {
            sortedGroups[key] = groups[key];
        }
    });
    
    // Add any remaining groups
    Object.keys(groups).forEach(key => {
        if (!sortedGroups[key]) {
            sortedGroups[key] = groups[key];
        }
    });
    
    return sortedGroups;
}

// Render subjects
function renderSubjects(groupedSubjects, container) {
    container.innerHTML = '';
    
    Object.entries(groupedSubjects).forEach(([rocnik, subjects]) => {
        // Create group section
        const groupDiv = document.createElement('div');
        groupDiv.className = 'rocnik-group';
        
        // Group title
        const titleEl = document.createElement('h3');
        titleEl.className = 'rocnik-title';
        titleEl.textContent = rocnik;
        groupDiv.appendChild(titleEl);
        
        // Create grid for this group
        const gridDiv = document.createElement('div');
        gridDiv.className = 'predmety-grid';
        
        subjects.forEach(subject => {
            const card = createSubjectCard(subject);
            gridDiv.appendChild(card);
        });
        
        groupDiv.appendChild(gridDiv);
        container.appendChild(groupDiv);
    });
}

// Create subject card
function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'predmet-card';
    
    // Get properties
    const predmet = getPlainText(subject.properties['Předmět']?.title);
    const kod = subject.properties['Kód']?.rich_text?.[0]?.plain_text || '';
    const status = subject.properties['Status']?.status?.name || 'Not started';
    const rocnik = subject.properties['Ročník']?.select?.name || '';
    const vyucujici = subject.properties['Vyučující']?.multi_select || [];
    const sylabus = subject.properties['Sylabus']?.url || '';
    const materialy = subject.properties['Materiály']?.url || '';
    
    // Card HTML
    card.innerHTML = `
        <div class="predmet-header">
            <h3 class="predmet-title">${predmet}</h3>
            <span class="predmet-status ${getStatusClass(status)}">${getStatusLabel(status)}</span>
        </div>
        
        <div class="predmet-meta">
            ${kod ? `<div class="predmet-kod">Kód: ${kod}</div>` : ''}
            ${rocnik ? `<div class="predmet-rocnik">${rocnik}</div>` : ''}
        </div>
        
        ${vyucujici.length > 0 ? `
            <div class="predmet-vyucujici">
                ${vyucujici.map(v => `<span class="vyucujici-tag">${v.name}</span>`).join('')}
            </div>
        ` : ''}
        
        ${(sylabus || materialy) ? `
            <div class="predmet-links">
                ${sylabus ? `<a href="${sylabus}" target="_blank" class="predmet-link">Sylabus</a>` : ''}
                ${materialy ? `<a href="${materialy}" target="_blank" class="predmet-link">Materiály</a>` : ''}
            </div>
        ` : ''}
    `;
    
    // Add animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    
    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
    
    return card;
}

// Load subjects when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchSubjects();
});
