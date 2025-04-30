document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('dummy')) {
            removeToolTip();
        }
    });

    document.querySelectorAll('.validated-input-num').forEach(input => {
        input.addEventListener('input', () => validateInputValue(input));
        input.addEventListener('blur', () => validateInputValue(input));
    });

    document.getElementById("generate").addEventListener("click", () => {
        generateProcess();
    });

    document.getElementById("copy").addEventListener("click", (e) => {
        copy(e);
    });

    document.getElementById("clear").addEventListener("click", () => {
        generateClear();
    });

    document.getElementById("spoiler").addEventListener("click", () => {
        spoilerAll();
    });

    document.getElementById("reveal").addEventListener("click", () => {
        revealAll();
    });

    document.getElementById("try-board").addEventListener("click", (e) => {
        boardHandleCellClick(e);
    });

    document.getElementById("try-board").addEventListener("mouseover", (e) => {
        boardHandleCellMouseOver(e);
    });

    document.getElementById("try-board").addEventListener("mouseout", (e) => {
        boardHandleCellMouseOut(e);
    });

    generateProcess();
});

function validateInputValue(input) {
    const max = parseInt(input.max, 10);
    const min = parseInt(input.min, 10);
    const defaultValue = parseInt(input.dataset.default, 10);
    let value = parseInt(input.value, 10);

    if (isNaN(value)) {
        return;
    } else if (value > max) {
        input.value = max;
    } else if (value < min) {
        input.value = min;
    }
}

function generateProcess() {
    const elements = getRunningStateElements();

    showRunningState(elements);

    setTimeout(() => {
        showCompletedState(elements, generate(elements.tryBoard));
    }, 500);
}

function generate(tryBoard) {
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);
    let count = parseInt(document.getElementById("count").value);
    const emoji = document.getElementById("emoji").value;
    const spoiler = document.getElementById("spoiler").checked;
    const revealOne = document.getElementById("reveal-safe").checked;

    if (count > (width - 1) * (height - 1)) {
        count = (width - 1) * (height - 1);
    }

    const board = Array.from({ length: height }, () => Array(width).fill(0));
    while (tryBoard.rows.length) tryBoard.deleteRow(0);

    let placed = 0;
    while (placed < count) {
        const r = getRandomInt(height);
        const c = getRandomInt(width);
        if (board[r][c] < 0) continue;
        board[r][c] = -10000;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < height && nc >= 0 && nc < width && board[nr][nc] >= 0) {
                    board[nr][nc]++;
                }
            }
        }
        placed++;
    }

    const safeCells = [];
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (board[r][c] === 0) safeCells.push({ r, c });
        }
    }
    const revealCell = revealOne && safeCells.length > 0 ? safeCells[getRandomInt(safeCells.length)] : null;

    let text = "";
    const emojiMap = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:"];
    for (let r = 0; r < height; r++) {
        const tr = tryBoard.insertRow();
        for (let c = 0; c < width; c++) {
            const td = tr.insertCell();
            const isReveal = revealCell && revealCell.r === r && revealCell.c === c;

            if (spoiler && !isReveal) td.classList.add("spoiler");
            if (isReveal) td.classList.add("isReveal");

            if (board[r][c] < 0) {
                td.textContent = "x";
                td.classList.add("danger-text");
                text += !isReveal ? `||${emoji}||` : emoji;
            } else {
                td.textContent = isReveal ? "●" : board[r][c] || "";
                const mark = emojiMap[board[r][c]] || ":zero:";
                text += !isReveal ? `||${mark}||` : mark;
            }
        }
        text += "\n";
    }

    return text;
}

function getRunningStateElements() {
    return {
        outputAccordion: document.getElementById("output-accordion"),
        summaryTextElem: document.getElementById("summary-text"),
        output: document.getElementById("output"),
        countDisplay: document.getElementById("character-count"),
        tryBoard: document.getElementById("try-board")
    };
}

function showRunningState(elements) {
    changeButtonDisabled(true);

    const { outputAccordion, summaryTextElem, output, countDisplay, tryBoard } = elements;
    outputAccordion.classList.remove("done");
    outputAccordion.classList.add("prog-bar");

    summaryTextElem.textContent = "生成中...";

    output.value = "";

    countDisplay.textContent = 0;
    countDisplay.classList.toggle("danger-text", false);

    tryBoard.style.visibility = "hidden";
}

function showCompletedState(elements, text) {
    changeButtonDisabled(false);

    const { outputAccordion, summaryTextElem, output, countDisplay, tryBoard } = elements;
    outputAccordion.classList.remove("prog-bar");
    outputAccordion.classList.add("done");

    summaryTextElem.textContent = "生成結果を表示";

    output.value = text;

    countDisplay.textContent = text.length;
    countDisplay.classList.toggle("danger-text", text.length > 2000);

    tryBoard.style.visibility = "";
}

function changeButtonDisabled(isDisabled) {
    document.getElementById("generate").disabled = isDisabled;
    document.getElementById("copy").disabled = isDisabled;
    document.getElementById("clear").disabled = isDisabled;
    document.getElementById("spoiler").disabled = isDisabled;
    document.getElementById("reveal").disabled = isDisabled;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function copy(event) {
    const output = document.getElementById("output");
    output.select();
    navigator.clipboard.writeText(output.value).then(() => {
        showToolTip(event);
    }).catch(err => {
        alert('コピーに失敗しました: ' + err);
    });
}

function showToolTip(event) {
    const target = event.target;
    if (!target.classList.contains("tgTtip")) {
        return;
    }

    const dataTooltip = target.getAttribute('data-tooltip');

    const tooltip = document.createElement('p');
    tooltip.className = 'tgToolTip';
    tooltip.textContent = dataTooltip;
    document.body.appendChild(tooltip);

    const rect = target.getBoundingClientRect();
    const buttonWidth = rect.width;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    const newPositionTop = rect.top + scrollTop - tooltipHeight - 8;
    const newPositionLeft = rect.left + scrollLeft + (buttonWidth / 2) - (tooltipWidth / 2);

    tooltip.style.top = newPositionTop + 'px';
    tooltip.style.left = newPositionLeft + 'px';

    const dummy = document.createElement('p');
    dummy.className = 'dummy';
    document.body.appendChild(dummy);

    setTimeout(() => {
        removeToolTip();
    }, 2000);
}

function removeToolTip() {
    var tooltip = document.querySelector('p.tgToolTip');
    var dummy = document.querySelector('p.dummy');
    if (tooltip) tooltip.remove();
    if (dummy) dummy.remove();
}

function generateClear() {
    document.getElementById("width").value = 9;
    document.getElementById("height").value = 9;
    document.getElementById("count").value = 10;
    document.getElementById("emoji").value = ":bomb:";
    document.getElementById("reveal-safe").checked = true;

    const elements = getRunningStateElements();
    elements.outputAccordion.classList.remove("done", "prog-bar");

    elements.output.value = "";

    elements.countDisplay.textContent = 0;
    elements.countDisplay.classList.toggle("danger-text", false);
    
    while (elements.tryBoard.rows.length) elements.tryBoard.deleteRow(0);
}

function revealAll() {
    document.querySelectorAll("#try-board td").forEach(td => td.classList.remove("spoiler"));
}

function spoilerAll() {
    document.querySelectorAll("#try-board td").forEach(td => {
        if (!td.classList.contains("isReveal")) {
            td.classList.add("spoiler");
        }
    });
}

function boardHandleCellClick(e) {
    if (e.target.tagName === "TD") {
        e.target.classList.remove("spoiler");
    }
}

function boardHandleCellMouseOver(e) {
    if (e.target.tagName === "TD") {
        const row = e.target.parentElement;
        row.classList.add("highlight-row");

        const index = [...e.target.parentElement.children].indexOf(e.target);
        document.querySelectorAll("#try-board tr").forEach(tr => {
            if (tr.children[index]) {
                tr.children[index].classList.add("highlight-col");
            }
        });
    }
}

function boardHandleCellMouseOut(e) {
    if (e.target.tagName === "TD") {
        const row = e.target.parentElement;
        row.classList.remove("highlight-row");

        const index = [...e.target.parentElement.children].indexOf(e.target);
        document.querySelectorAll("#try-board tr").forEach(tr => {
            if (tr.children[index]) {
                tr.children[index].classList.remove("highlight-col");
            }
        });
    }
}