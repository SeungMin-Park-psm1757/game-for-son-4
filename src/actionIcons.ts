function buildIllustration(svg: string) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

const ILLUSTRATED_ICON_URLS: Record<string, string> = {
    'dock-feed': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="leafA" x1="120" y1="118" x2="332" y2="382" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#b8eca2"/>
                    <stop offset="1" stop-color="#4f9b68"/>
                </linearGradient>
                <linearGradient id="leafB" x1="238" y1="84" x2="392" y2="302" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#d7f4b6"/>
                    <stop offset="1" stop-color="#5eaf71"/>
                </linearGradient>
                <linearGradient id="berry" x1="300" y1="262" x2="378" y2="348" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#ffd2a0"/>
                    <stop offset="1" stop-color="#f0835f"/>
                </linearGradient>
                <filter id="shadow" x="48" y="72" width="388" height="376" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#28494d" flood-opacity="0.16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M194 406c-9 0-16-7-16-16V138c0-10 7-18 16-18s16 8 16 18v252c0 9-7 16-16 16Z" fill="#6d4c3d"/>
                <path d="M191 209c-56 0-102-32-118-84 64-8 119 8 152 42 28 29 34 67 20 111-18-21-33-36-54-47Z" fill="url(#leafA)"/>
                <path d="M205 206c23-66 83-108 169-113-12 82-64 150-141 160-26 4-50-1-74-15 18-11 31-21 46-32Z" fill="url(#leafB)"/>
                <path d="M219 238c27 10 48 28 64 56" stroke="#e8ffd9" stroke-width="12" stroke-linecap="round"/>
                <circle cx="327" cy="312" r="48" fill="url(#berry)"/>
                <path d="M307 300c22 6 38 18 47 36" stroke="#fff1d8" stroke-width="10" stroke-linecap="round"/>
                <ellipse cx="351" cy="281" rx="18" ry="10" fill="#ffe8cb" opacity=".75" transform="rotate(-28 351 281)"/>
            </g>
        </svg>
    `),
    'dock-train': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="rim" x1="132" y1="89" x2="383" y2="296" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fdfefe"/>
                    <stop offset="1" stop-color="#c8e8ef"/>
                </linearGradient>
                <linearGradient id="grip" x1="260" y1="280" x2="406" y2="420" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#c99262"/>
                    <stop offset="1" stop-color="#8f5d3b"/>
                </linearGradient>
                <radialGradient id="ball" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(345 363) rotate(90) scale(61)">
                    <stop offset="0" stop-color="#fffbe7"/>
                    <stop offset="1" stop-color="#ffd86d"/>
                </radialGradient>
                <filter id="shadow" x="78" y="68" width="344" height="370" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#29444c" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <ellipse cx="233" cy="203" rx="112" ry="122" fill="url(#rim)"/>
                <ellipse cx="233" cy="203" rx="88" ry="98" fill="#f6ffff" stroke="#5b9ab1" stroke-width="12"/>
                <path d="M292 287c55 43 90 77 106 103 8 14 5 30-8 42-14 12-30 13-44 3-29-20-61-55-97-108" fill="url(#grip)"/>
                <path d="M154 146h158M145 176h177M145 207h177M154 238h158M179 117v172M211 107v190M244 107v190M277 117v172" stroke="#b5d9e6" stroke-width="9" stroke-linecap="round"/>
                <circle cx="340" cy="364" r="43" fill="url(#ball)"/>
                <path d="M318 348c17-10 35-10 54 0M323 384c16 10 34 10 50 0M298 364c10-16 26-25 42-25M382 364c-10-16-26-25-42-25" stroke="#d78e34" stroke-width="8" stroke-linecap="round"/>
            </g>
        </svg>
    `),
    'dock-sleep': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <radialGradient id="moonGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(252 218) rotate(90) scale(154)">
                    <stop offset="0" stop-color="#fff8d8"/>
                    <stop offset=".55" stop-color="#ffe393"/>
                    <stop offset="1" stop-color="#f4bc55"/>
                </radialGradient>
                <filter id="shadow" x="84" y="76" width="344" height="360" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#2c3f5a" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M321 127c-55 8-103 58-109 123-8 83 50 154 129 162 45 4 86-12 117-42-31 13-66 17-100 11-78-14-129-89-113-169 7-34 25-63 51-85-10-1-19-1-25 0Z" fill="url(#moonGlow)"/>
                <path d="M373 152c13 6 24 17 29 31 6-14 16-25 30-31-14-6-24-17-30-31-5 14-16 25-29 31ZM138 231c10 5 18 14 22 25 4-11 12-20 23-25-11-5-19-14-23-25-4 11-12 20-22 25ZM184 140c7 3 13 10 16 18 3-8 8-15 16-18-8-4-13-10-16-19-3 9-9 15-16 19Z" fill="#fff3c7"/>
                <path d="M137 332c33-31 64-45 95-41 15 2 28 10 40 24 13-24 34-37 64-38 38-2 68 14 92 49-31-12-62-7-95 16-23 17-40 25-51 25-14 0-28-8-42-24-26-26-61-29-103-11Z" fill="#dfeef8"/>
            </g>
        </svg>
    `),
    'dock-wash': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="metal" x1="167" y1="132" x2="360" y2="238" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#edf6fb"/>
                    <stop offset="1" stop-color="#8aa2bc"/>
                </linearGradient>
                <linearGradient id="water" x1="242" y1="221" x2="314" y2="406" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#bdefff"/>
                    <stop offset="1" stop-color="#59addf"/>
                </linearGradient>
                <filter id="shadow" x="98" y="88" width="304" height="344" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#29444c" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M172 164c10-33 29-56 59-70 45-22 90-16 137 15 7 5 9 15 5 22l-19 33c-4 8-14 11-22 6-32-21-60-24-85-10-16 9-26 22-32 42h110c25 0 46 21 46 46 0 25-21 46-46 46H173c-13 0-24-11-24-24 0-13 11-24 24-24h17c-11-26-12-53-2-82Z" fill="url(#metal)"/>
                <path d="M244 289c18 19 18 45 0 78-12 24-18 45-18 63 0 20 14 31 42 31 28 0 42-11 42-31 0-18-6-39-18-63-18-33-18-59 0-78-18 4-34 4-48 0Z" fill="url(#water)"/>
                <circle cx="348" cy="316" r="24" fill="#eefcff"/>
                <circle cx="149" cy="344" r="16" fill="#eefcff"/>
                <circle cx="191" cy="396" r="12" fill="#d6f7ff"/>
            </g>
        </svg>
    `),
    'dock-shop': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="basketBody" x1="120" y1="164" x2="374" y2="372" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#f2d0a4"/>
                    <stop offset="1" stop-color="#b87b4b"/>
                </linearGradient>
                <linearGradient id="cloth" x1="150" y1="146" x2="352" y2="252" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff5e8"/>
                    <stop offset="1" stop-color="#ffe0c7"/>
                </linearGradient>
                <filter id="shadow" x="86" y="102" width="336" height="316" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#594534" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M152 189c0-43 35-78 78-78h52c43 0 78 35 78 78" stroke="#a76f43" stroke-width="26" stroke-linecap="round"/>
                <path d="M121 196h270l-22 136c-6 38-39 66-77 66H220c-38 0-71-28-77-66l-22-136Z" fill="url(#basketBody)"/>
                <path d="M151 196h210l-16 99c-5 29-29 51-58 51h-62c-29 0-53-22-58-51l-16-99Z" fill="url(#cloth)"/>
                <path d="M165 227h182M157 264h198M151 302h210" stroke="#d7a16c" stroke-width="14" stroke-linecap="round"/>
                <path d="M193 196v177M256 196v186M319 196v177" stroke="#9b663d" stroke-width="12" stroke-linecap="round" opacity=".75"/>
            </g>
        </svg>
    `),
    'dock-interact': buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="bubble" x1="104" y1="120" x2="381" y2="336" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff7fe"/>
                    <stop offset="1" stop-color="#eadcff"/>
                </linearGradient>
                <linearGradient id="heart" x1="198" y1="170" x2="301" y2="284" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#ff9ab8"/>
                    <stop offset="1" stop-color="#d95883"/>
                </linearGradient>
                <filter id="shadow" x="74" y="98" width="364" height="324" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#52436b" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M141 136h230c49 0 88 39 88 88v30c0 49-39 88-88 88H260l-84 61c-14 10-34 0-34-17v-44c-44-8-77-45-77-88v-30c0-49 39-88 88-88Z" fill="url(#bubble)"/>
                <path d="M255 281c-9 0-18-4-26-11l-38-35c-16-15-16-41-1-56 15-16 40-16 56-1l9 9 9-9c15-15 41-15 56 1 15 15 15 41-1 56l-38 35c-8 7-17 11-26 11Z" fill="url(#heart)"/>
                <circle cx="145" cy="246" r="12" fill="#d6c8f5"/>
                <circle cx="355" cy="190" r="10" fill="#f7bed1"/>
            </g>
        </svg>
    `),
    train_ball: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <radialGradient id="ballBase" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(203 171) rotate(49) scale(218)">
                    <stop offset="0" stop-color="#ffffff"/>
                    <stop offset="1" stop-color="#d8e5ec"/>
                </radialGradient>
                <filter id="shadow" x="84" y="86" width="344" height="348" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#334a53" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <circle cx="256" cy="240" r="142" fill="url(#ballBase)"/>
                <path d="M255 148 296 178 281 226 229 226 214 178 255 148ZM182 213l29 17-7 49-47 18-32-35 9-41 48-8ZM330 213l48 8 9 41-32 35-47-18-7-49 29-17ZM201 314l27-19h56l27 19-10 48-46 22-46-22-8-48Z" fill="#44535f"/>
                <path d="M255 97c42 0 80 11 114 34M113 240c0-18 3-36 9-52M390 188c6 16 9 34 9 52M145 340c17 21 39 37 64 48M303 388c25-11 47-27 64-48" stroke="#adc6d5" stroke-width="12" stroke-linecap="round" opacity=".8"/>
                <ellipse cx="209" cy="156" rx="39" ry="21" fill="#ffffff" opacity=".72" transform="rotate(-27 209 156)"/>
            </g>
        </svg>
    `),
    train_frisbee: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="discA" x1="136" y1="168" x2="376" y2="314" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#9be0ff"/>
                    <stop offset="1" stop-color="#448fd6"/>
                </linearGradient>
                <linearGradient id="discB" x1="169" y1="193" x2="342" y2="288" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#e5f7ff"/>
                    <stop offset="1" stop-color="#8bc8ff"/>
                </linearGradient>
                <filter id="shadow" x="89" y="120" width="334" height="260" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#2f5370" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <ellipse cx="256" cy="250" rx="146" ry="94" fill="url(#discA)"/>
                <ellipse cx="256" cy="246" rx="108" ry="66" fill="url(#discB)"/>
                <ellipse cx="256" cy="246" rx="72" ry="39" fill="#d9f5ff"/>
                <path d="M134 230c39-28 80-42 122-42 46 0 92 14 138 43" stroke="#f2fbff" stroke-width="14" stroke-linecap="round" opacity=".85"/>
                <ellipse cx="207" cy="203" rx="38" ry="14" fill="#ffffff" opacity=".52" transform="rotate(-18 207 203)"/>
            </g>
        </svg>
    `),
    train_discipline: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="rulerBase" x1="112" y1="332" x2="403" y2="133" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#d7e1e8"/>
                    <stop offset="1" stop-color="#f8fbfd"/>
                </linearGradient>
                <filter id="shadow" x="80" y="92" width="352" height="328" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#51616b" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <rect x="118" y="162" width="276" height="72" rx="24" transform="rotate(-35 118 162)" fill="url(#rulerBase)" stroke="#7f94a1" stroke-width="12"/>
                <path d="m179 288 25-17M207 268l17-12M235 249l25-17M262 229l17-12M290 210l25-17M317 190l17-12" stroke="#7b8f9b" stroke-width="9" stroke-linecap="round"/>
                <path d="m168 304 17-12M196 284l9-6M251 246l9-6M306 207l9-6" stroke="#c65b55" stroke-width="7" stroke-linecap="round"/>
                <ellipse cx="295" cy="175" rx="34" ry="13" fill="#ffffff" opacity=".58" transform="rotate(-35 295 175)"/>
            </g>
        </svg>
    `),
    train_walk: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="paw" x1="150" y1="142" x2="353" y2="373" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#7e6352"/>
                    <stop offset="1" stop-color="#4c392e"/>
                </linearGradient>
                <linearGradient id="leaf" x1="308" y1="171" x2="405" y2="263" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#d7f4b0"/>
                    <stop offset="1" stop-color="#5ca46e"/>
                </linearGradient>
                <filter id="shadow" x="95" y="95" width="328" height="322" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#46372f" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M176 304c0-34 24-58 61-58 37 0 61 24 61 58 0 38-31 66-61 66s-61-28-61-66Z" fill="url(#paw)"/>
                <ellipse cx="184" cy="214" rx="27" ry="37" fill="url(#paw)" transform="rotate(-18 184 214)"/>
                <ellipse cx="232" cy="185" rx="28" ry="40" fill="url(#paw)" transform="rotate(-6 232 185)"/>
                <ellipse cx="283" cy="188" rx="28" ry="40" fill="url(#paw)" transform="rotate(11 283 188)"/>
                <ellipse cx="329" cy="221" rx="27" ry="37" fill="url(#paw)" transform="rotate(24 329 221)"/>
                <path d="M301 260c36-28 70-41 102-39" stroke="#cfc3b8" stroke-width="12" stroke-linecap="round" opacity=".75"/>
                <path d="M354 246c20-15 38-20 54-15-3 27-17 47-42 58-10-13-14-27-12-43Z" fill="url(#leaf)"/>
                <path d="M370 257c13 4 23 12 30 23" stroke="#ecffe0" stroke-width="8" stroke-linecap="round"/>
            </g>
        </svg>
    `),
    train_sing: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="note" x1="191" y1="117" x2="340" y2="374" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#a77aff"/>
                    <stop offset="1" stop-color="#6432c9"/>
                </linearGradient>
                <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(324 168) rotate(90) scale(88)">
                    <stop offset="0" stop-color="#eadbff"/>
                    <stop offset="1" stop-color="#eadbff" stop-opacity="0"/>
                </radialGradient>
                <filter id="shadow" x="118" y="88" width="278" height="338" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#4c2f7c" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <circle cx="330" cy="167" r="70" fill="url(#glow)"/>
                <path d="M304 120v168c0 36-28 65-68 65-31 0-56-21-56-48 0-29 25-52 56-52 16 0 30 5 41 13V152l116-35v145c0 36-28 65-68 65-31 0-56-21-56-48 0-29 25-52 56-52 16 0 30 5 41 13V137l-62 18Z" fill="url(#note)"/>
                <path d="M179 120c8 10 16 15 26 17-11 5-18 12-22 24-5-11-11-19-21-23 9-4 16-11 17-23ZM370 84c5 7 11 11 18 13-7 3-12 8-15 16-4-8-8-13-15-16 7-2 12-6 12-13Z" fill="#ebdefe"/>
            </g>
        </svg>
    `),
    train_dance: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="ribbonA" x1="154" y1="112" x2="360" y2="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#ffb19e"/>
                    <stop offset="1" stop-color="#df5d62"/>
                </linearGradient>
                <linearGradient id="ribbonB" x1="233" y1="118" x2="388" y2="352" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#ffd5b0"/>
                    <stop offset="1" stop-color="#f2a43b"/>
                </linearGradient>
                <filter id="shadow" x="104" y="84" width="310" height="344" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#5b3e48" flood-opacity=".18"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M190 119c35 23 61 54 78 92 18 38 20 81 7 129-8 28-25 54-51 77 7-39 0-72-22-98-19-24-42-38-70-42 26-10 45-28 57-54 13-27 13-62 1-104Z" fill="url(#ribbonA)"/>
                <path d="M251 124c23 18 44 42 61 72 22 37 33 77 33 118 0 39-11 72-33 99-2-37-15-68-38-91-22-22-51-34-88-35 29-15 48-37 58-67 10-30 12-62 7-96Z" fill="url(#ribbonB)"/>
                <circle cx="320" cy="153" r="21" fill="#ffe8d1"/>
                <path d="M148 319c9 7 21 11 35 12-13 6-21 15-25 29-6-13-13-22-28-28 14-4 22-12 25-25 4 7 8 11 13 12ZM355 242c8 6 18 9 29 11-11 5-18 12-21 24-5-11-11-18-23-23 11-3 18-10 21-21 3 5 8 8 13 9Z" fill="#fff1d1"/>
            </g>
        </svg>
    `),
    sleep_floor: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="mat" x1="126" y1="253" x2="384" y2="350" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#c7d6eb"/>
                    <stop offset="1" stop-color="#8da7c8"/>
                </linearGradient>
                <linearGradient id="lamp" x1="362" y1="124" x2="406" y2="246" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff5c9"/>
                    <stop offset="1" stop-color="#f4c56a"/>
                </linearGradient>
                <filter id="shadow" x="84" y="98" width="344" height="316" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#3d4852" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <rect x="108" y="295" width="296" height="74" rx="32" fill="url(#mat)"/>
                <rect x="132" y="274" width="104" height="49" rx="24.5" fill="#f7f8ff"/>
                <path d="M115 166c0-31 25-56 56-56h41v140h-97V166Z" fill="#d8e4f0"/>
                <path d="M363 152h38l14 29v129h-66V181l14-29Z" fill="#7e6958"/>
                <path d="M348 142c0-18 15-33 33-33h16c18 0 33 15 33 33v22h-82v-22Z" fill="url(#lamp)"/>
                <path d="M368 143h42" stroke="#fff6df" stroke-width="10" stroke-linecap="round"/>
                <ellipse cx="386" cy="133" rx="56" ry="40" fill="#ffe8a0" opacity=".3"/>
            </g>
        </svg>
    `),
    sleep_outside: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <radialGradient id="moon" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(373 131) rotate(90) scale(77)">
                    <stop offset="0" stop-color="#fff5c4"/>
                    <stop offset="1" stop-color="#f3c862"/>
                </radialGradient>
                <linearGradient id="tent" x1="152" y1="194" x2="338" y2="355" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#7ea6d8"/>
                    <stop offset="1" stop-color="#476f9c"/>
                </linearGradient>
                <linearGradient id="hill" x1="92" y1="274" x2="420" y2="392" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#5d8671"/>
                    <stop offset="1" stop-color="#27453f"/>
                </linearGradient>
                <filter id="shadow" x="72" y="74" width="370" height="360" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#1d3242" flood-opacity=".2"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <circle cx="372" cy="132" r="54" fill="url(#moon)"/>
                <path d="M88 310c35-29 74-44 117-44 44 0 84 15 120 44-20 6-41 17-61 33-20 17-39 26-58 26-22 0-43-10-63-30-19-19-37-29-55-29Z" fill="#456d61"/>
                <path d="M268 216 376 343H160l108-127Z" fill="url(#tent)"/>
                <path d="M268 216 318 343H218l50-127Z" fill="#d7ecff" opacity=".85"/>
                <path d="M134 356c28-11 59-16 92-16 59 0 107 18 144 53H88c11-16 27-28 46-37Z" fill="url(#hill)"/>
                <path d="M158 145c8 4 14 10 16 19 3-9 8-15 17-19-8-3-14-10-17-19-2 9-8 16-16 19ZM103 198c6 3 10 8 12 15 2-7 6-12 13-15-7-3-11-8-13-15-2 7-6 12-12 15Z" fill="#fff2c0"/>
            </g>
        </svg>
    `),
    sleep_bed: buildIllustration(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
            <defs>
                <linearGradient id="frame" x1="115" y1="212" x2="395" y2="352" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#9e6c4f"/>
                    <stop offset="1" stop-color="#6d4531"/>
                </linearGradient>
                <linearGradient id="blanket" x1="154" y1="220" x2="359" y2="327" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#f4bac2"/>
                    <stop offset="1" stop-color="#d97e9e"/>
                </linearGradient>
                <filter id="shadow" x="84" y="98" width="344" height="324" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#4f3a36" flood-opacity=".16"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <rect x="104" y="285" width="304" height="77" rx="26" fill="url(#frame)"/>
                <rect x="133" y="222" width="246" height="85" rx="34" fill="url(#blanket)"/>
                <rect x="152" y="205" width="98" height="48" rx="24" fill="#f8f6ff"/>
                <path d="M104 285v91M408 285v91" stroke="#704834" stroke-width="18" stroke-linecap="round"/>
                <path d="M133 255h246" stroke="#ffd6e2" stroke-width="10" stroke-linecap="round" opacity=".6"/>
                <path d="M331 122c0-22 18-40 40-40h18c22 0 40 18 40 40v64h-98v-64Z" fill="#dce7f7"/>
                <circle cx="380" cy="144" r="20" fill="#fff4b7"/>
            </g>
        </svg>
    `),
};

export function getActionIconUrl(key: string) {
    return ILLUSTRATED_ICON_URLS[key] ?? '';
}

export function getActionIconMarkup(key: string, fallbackEmoji: string, className: string) {
    const url = getActionIconUrl(key);
    if (!url) return `<span aria-hidden="true">${fallbackEmoji}</span>`;
    return `<img src="${url}" alt="" aria-hidden="true" class="${className}" />`;
}
