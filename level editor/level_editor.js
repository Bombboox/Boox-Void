const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const objectList = document.getElementById('object-list');
const propertiesPanel = document.getElementById('properties-panel');
const exportButton = document.getElementById('export-button');
const importButton = document.getElementById('import-button');
const importFileInput = document.getElementById('import-file-input');
const snapToggle = document.getElementById('snap-toggle');

let objects = []; // Array to hold all objects in the level
let selectedObjects = []; // Array to hold selected objects
let isDragging = false;
let isPanning = false;
let isSelecting = false;
let isResizing = false;
let dragStartX, dragStartY;
let dragOffsets = []; // Store individual offsets for multi-drag
let currentObjectType = null; // Type of object selected from the sidebar
let currentTool = 'create'; // Default tool: 'create', 'select', 'pan'
let panOffset = { x: 0, y: 0 };
let selectionRect = { x: 0, y: 0, width: 0, height: 0 };
let resizeHandle = null;
let clipboard = [];
let zoomLevel = 1; // Default zoom level
let isSpaceDown = false; // Track if space bar is pressed
let snapToGrid = false; // Track if grid snapping is enabled
let actionHistory = []; // Array to store state history for undo
let historyIndex = -1; // Pointer to current state in history
const GRID_SIZE = 50; // Base grid size constant
let enemyTags = {}; // To store loaded enemy tags

async function loadEnemyTags() {
    try {
        const response = await fetch('enemy_key.json'); // Assuming enemy_key.json is in the same directory or accessible path
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        enemyTags = await response.json();
        console.log("Enemy tags loaded:", enemyTags);
    } catch (error) {
        console.error("Error loading enemy tags:", error);
    }
}

function saveState() {
    // Clear future history if we undo and then make a new change
    if (historyIndex < actionHistory.length - 1) {
        actionHistory = actionHistory.slice(0, historyIndex + 1);
    }
    
    // Store a deep copy of the current objects state
    actionHistory.push(JSON.parse(JSON.stringify(objects)));
    historyIndex++;
    
    // Limit history size (optional)
    // const MAX_HISTORY = 50;
    // if (actionHistory.length > MAX_HISTORY) {
    //     actionHistory.shift();
    //     historyIndex--;
    // }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        objects = JSON.parse(JSON.stringify(actionHistory[historyIndex]));
        selectedObjects = []; // Clear selection after undo
        updatePropertiesPanel();
        draw();
        console.log("Undo performed. History index:", historyIndex);
    } else {
        console.log("Nothing to undo.");
    }
}

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw(); // Redraw canvas content after resize
}

function drawGrid() {
    const gridSize = GRID_SIZE * zoomLevel;
    const gridColor = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Apply pan offset to grid
    const offsetX = panOffset.x % gridSize;
    const offsetY = panOffset.y % gridSize;

    // Vertical lines
    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawObjects() {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    
    objects.forEach(obj => {
        // Basic rendering logic - will be expanded
        ctx.fillStyle = obj.color || 'blue';
        if (obj.type === 'Rectangle') {
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            
            // Draw outline with solid color (not affected by transparency)
            ctx.strokeStyle = obj.color ? obj.color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(?:\d*(?:\.\d+)?))?\)/, 'rgb($1, $2, $3)') : 'blue';
            ctx.lineWidth = 2 / zoomLevel;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            
            // Draw tag if it exists
            if (obj.tag) {
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(obj.tag, obj.x + obj.width/2, obj.y - 5);
            }
        } else if (obj.type === 'Circle') {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw outline with solid color
            ctx.strokeStyle = obj.color ? obj.color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(?:\d*(?:\.\d+)?))?\)/, 'rgb($1, $2, $3)') : 'green';
            ctx.lineWidth = 2 / zoomLevel;
            ctx.stroke();
            
            // Draw tag if it exists
            if (obj.tag) {
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(obj.tag, obj.x, obj.y - obj.radius - 5);
            }
        } else if (obj.type === 'Point') {
            // Draw point as a small circle
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw outline with solid color
            ctx.strokeStyle = obj.color ? obj.color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(?:\d*(?:\.\d+)?))?\)/, 'rgb($1, $2, $3)') : 'red';
            ctx.lineWidth = 2 / zoomLevel;
            ctx.stroke();
            
            // Draw tag text above the point
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obj.tag || '', obj.x, obj.y - 10);
        }

        // Highlight selected objects
        if (selectedObjects.includes(obj)) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2 / zoomLevel; // Adjust line width for zoom
            if (obj.type === 'Rectangle') {
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                
                // Draw resize handles
                if (currentTool === 'select') {
                    drawResizeHandles(obj);
                }
            } else if (obj.type === 'Circle') {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw resize handles for circle
                if (currentTool === 'select') {
                    drawCircleResizeHandles(obj);
                }
            } else if (obj.type === 'Point') {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
    
    // Draw selection rectangle if selecting
    if (isSelecting) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1 / zoomLevel;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
        ctx.setLineDash([]);
    }
    
    ctx.restore();
}

function drawResizeHandles(obj) {
    const handles = [
        { x: obj.x, y: obj.y, cursor: 'nwse-resize', position: 'tl' },
        { x: obj.x + obj.width, y: obj.y, cursor: 'nesw-resize', position: 'tr' },
        { x: obj.x, y: obj.y + obj.height, cursor: 'nesw-resize', position: 'bl' },
        { x: obj.x + obj.width, y: obj.y + obj.height, cursor: 'nwse-resize', position: 'br' },
        { x: obj.x + obj.width/2, y: obj.y, cursor: 'ns-resize', position: 't' },
        { x: obj.x + obj.width, y: obj.y + obj.height/2, cursor: 'ew-resize', position: 'r' },
        { x: obj.x + obj.width/2, y: obj.y + obj.height, cursor: 'ns-resize', position: 'b' },
        { x: obj.x, y: obj.y + obj.height/2, cursor: 'ew-resize', position: 'l' }
    ];
    
    ctx.fillStyle = 'white';
    handles.forEach(handle => {
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 4 / zoomLevel, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

function drawCircleResizeHandles(obj) {
    const handles = [
        { x: obj.x + obj.radius, y: obj.y, cursor: 'ew-resize', position: 'r' },
        { x: obj.x - obj.radius, y: obj.y, cursor: 'ew-resize', position: 'l' },
        { x: obj.x, y: obj.y - obj.radius, cursor: 'ns-resize', position: 't' },
        { x: obj.x, y: obj.y + obj.radius, cursor: 'ns-resize', position: 'b' }
    ];
    
    ctx.fillStyle = 'white';
    handles.forEach(handle => {
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 4 / zoomLevel, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Draw all placed objects
    drawObjects();
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    let x = (evt.clientX - rect.left - panOffset.x) / zoomLevel;
    let y = (evt.clientY - rect.top - panOffset.y) / zoomLevel;

    return { x, y };
}

function getMousePosWithoutOffset(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function checkResizeHandle(mousePos) {
    if (selectedObjects.length !== 1) return null;
    
    const obj = selectedObjects[0];
    let handles;
    
    if (obj.type === 'Rectangle') {
        handles = [
            { x: obj.x, y: obj.y, cursor: 'nwse-resize', position: 'tl' },
            { x: obj.x + obj.width, y: obj.y, cursor: 'nesw-resize', position: 'tr' },
            { x: obj.x, y: obj.y + obj.height, cursor: 'nesw-resize', position: 'bl' },
            { x: obj.x + obj.width, y: obj.y + obj.height, cursor: 'nwse-resize', position: 'br' },
            { x: obj.x + obj.width/2, y: obj.y, cursor: 'ns-resize', position: 't' },
            { x: obj.x + obj.width, y: obj.y + obj.height/2, cursor: 'ew-resize', position: 'r' },
            { x: obj.x + obj.width/2, y: obj.y + obj.height, cursor: 'ns-resize', position: 'b' },
            { x: obj.x, y: obj.y + obj.height/2, cursor: 'ew-resize', position: 'l' }
        ];
    } else if (obj.type === 'Circle') {
        handles = [
            { x: obj.x + obj.radius, y: obj.y, cursor: 'ew-resize', position: 'r' },
            { x: obj.x - obj.radius, y: obj.y, cursor: 'ew-resize', position: 'l' },
            { x: obj.x, y: obj.y - obj.radius, cursor: 'ns-resize', position: 't' },
            { x: obj.x, y: obj.y + obj.radius, cursor: 'ns-resize', position: 'b' }
        ];
    } else {
        return null;
    }
    
    for (const handle of handles) {
        const dx = mousePos.x - handle.x;
        const dy = mousePos.y - handle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= 6 / zoomLevel) {
            return { obj, position: handle.position, cursor: handle.cursor };
        }
    }
    
    return null;
}

function isPointInObject(point, obj) {
    if (obj.type === 'Rectangle') {
        return point.x >= obj.x && point.x <= obj.x + obj.width &&
               point.y >= obj.y && point.y <= obj.y + obj.height;
    } else if (obj.type === 'Circle') {
        const dx = point.x - obj.x;
        const dy = point.y - obj.y;
        return Math.sqrt(dx * dx + dy * dy) <= obj.radius;
    } else if (obj.type === 'Point') {
        const dx = point.x - obj.x;
        const dy = point.y - obj.y;
        return Math.sqrt(dx * dx + dy * dy) <= 8; // 8px hit area for points
    }
    return false;
}

function handleMouseDown(e) {
    saveState(); // Save state before potential modification
    const mousePos = getMousePos(e);
    const mousePosRaw = getMousePosWithoutOffset(e);
    
    // Check if space bar is pressed for quick panning
    if (isSpaceDown) {
        isPanning = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        canvas.style.cursor = 'grabbing';
        return;
    }
    
    // Check if we're resizing
    if (currentTool === 'select') {
        const handle = checkResizeHandle(mousePos);
        if (handle) {
            isResizing = true;
            resizeHandle = handle;
            dragStartX = mousePosRaw.x;
            dragStartY = mousePosRaw.y;
            return;
        }
    }
    
    // Handle different tools
    if (currentTool === 'pan') {
        isPanning = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        canvas.style.cursor = 'grabbing';
        return;
    } else if (currentTool === 'select') {
        // Check if clicking on an existing object
        let clickedOnSelected = false;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (isPointInObject(mousePos, obj)) {
                if (selectedObjects.includes(obj)) {
                    clickedOnSelected = true; // Clicked on an already selected object
                }
                if (!e.ctrlKey && !selectedObjects.includes(obj)) {
                    selectedObjects = [obj]; // Select only this object if ctrl not pressed
                } else if (e.ctrlKey) {
                    // Toggle selection with ctrl
                    if (selectedObjects.includes(obj)) {
                        selectedObjects = selectedObjects.filter(o => o !== obj);
                    } else {
                        selectedObjects.push(obj);
                    }
                }
                
                if (selectedObjects.includes(obj)) {
                    isDragging = true;
                    // Store initial offsets for ALL selected objects relative to the mouse
                    dragOffsets = selectedObjects.map(selObj => ({
                        obj: selObj,
                        offsetX: mousePos.x - selObj.x,
                        offsetY: mousePos.y - selObj.y
                    }));
                    updatePropertiesPanel();
                    draw();
                    return; // Exit after starting drag
                }
            }
        }
        
        // If clicking empty space or an unselected object without ctrl
        if (!clickedOnSelected && !e.ctrlKey) {
            selectedObjects = []; // Clear selection
            // Now check again if we clicked an unselected object to select just it
            for (let i = objects.length - 1; i >= 0; i--) {
                 const obj = objects[i];
                 if (isPointInObject(mousePos, obj)) {
                     selectedObjects = [obj];
                     isDragging = true;
                     // Store offset for the single newly selected object
                     dragOffsets = [{ obj: obj, offsetX: mousePos.x - obj.x, offsetY: mousePos.y - obj.y }];
                     updatePropertiesPanel();
                     draw();
                     return;
                 }
            }
        }

        // If not clicking an object, start selection rectangle
        if (!isDragging) {
            if (!e.ctrlKey) selectedObjects = []; // Clear selection if needed
            isSelecting = true;
            selectionRect.x = mousePos.x;
            selectionRect.y = mousePos.y;
            selectionRect.width = 0;
            selectionRect.height = 0;
        }
    } else if (currentTool === 'create') {
        // Original object creation logic
        isDragging = false;
        if (!e.ctrlKey) selectedObjects = []; // Clear selection
        
        // Check if clicking on an existing object
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (isPointInObject(mousePos, obj)) {
                selectedObjects = [obj];
                isDragging = true;
                dragOffsets = [{ obj: obj, offsetX: mousePos.x - obj.x, offsetY: mousePos.y - obj.y }];
                updatePropertiesPanel();
                draw();
                return;
            }
        }
        
        // If not clicking an object and an object type is selected, create a new one
        if (currentObjectType) {
            let newObj;
            let snappedX = snapToGrid ? Math.round(mousePos.x / GRID_SIZE) * GRID_SIZE : mousePos.x;
            let snappedY = snapToGrid ? Math.round(mousePos.y / GRID_SIZE) * GRID_SIZE : mousePos.y;
            
            if (currentObjectType === 'Rectangle') {
                newObj = { type: 'Rectangle', x: snappedX, y: snappedY, width: GRID_SIZE, height: GRID_SIZE, color: 'blue', tag: '' };
            } else if (currentObjectType === 'Circle') {
                newObj = { type: 'Circle', x: snappedX, y: snappedY, radius: GRID_SIZE / 2, color: 'green', tag: '' };
            } else if (currentObjectType === 'Point') {
                newObj = { type: 'Point', x: snappedX, y: snappedY, tag: '', color: 'red' };
            }
            if (newObj) {
                objects.push(newObj);
                selectedObjects = [newObj];
                isDragging = true; // Allow dragging immediately
                // Offset relative to the object's (snapped) origin
                dragOffsets = [{ obj: newObj, offsetX: mousePos.x - newObj.x, offsetY: mousePos.y - newObj.y }]; 
                updatePropertiesPanel();
                saveState(); // Save state after creating an object
            }
        }
    }
    
    updatePropertiesPanel();
    draw();
}

function handleMouseMove(e) {
    const mousePos = getMousePos(e);
    const mousePosRaw = getMousePosWithoutOffset(e);
    
    // Handle resizing
    if (isResizing && resizeHandle) {
        const obj = resizeHandle.obj;
        const minSize = snapToGrid ? GRID_SIZE : 10;
        const halfGrid = GRID_SIZE / 2;

        // Calculate target coordinates based on raw mouse movement
        // We apply snapping *after* determining the target edge/corner based on mouse
        let targetX = mousePos.x;
        let targetY = mousePos.y;

        if (obj.type === 'Rectangle') {
            // Keep track of original fixed edges
            const fixedX = (resizeHandle.position.includes('l')) ? obj.x + obj.width : obj.x;
            const fixedY = (resizeHandle.position.includes('t')) ? obj.y + obj.height : obj.y;
            const fixedWidth = obj.width;
            const fixedHeight = obj.height;
            
            let newX = obj.x, newY = obj.y, newWidth = obj.width, newHeight = obj.height;

            // Snap the target mouse position if needed
            if (snapToGrid) {
                targetX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
                targetY = Math.round(targetY / GRID_SIZE) * GRID_SIZE;
            }

            // Adjust object based on the handle being dragged and the (snapped) target mouse position
            if (resizeHandle.position.includes('l')) {
                newX = targetX;
                newWidth = fixedX - newX;
            } else if (resizeHandle.position.includes('r')) {
                newWidth = targetX - newX;
            }

            if (resizeHandle.position.includes('t')) {
                newY = targetY;
                newHeight = fixedY - newY;
            } else if (resizeHandle.position.includes('b')) {
                newHeight = targetY - newY;
            }
            
             // If only horizontal or vertical handle, keep other dimension fixed
            if (resizeHandle.position === 't' || resizeHandle.position === 'b') newWidth = fixedWidth;
            if (resizeHandle.position === 'l' || resizeHandle.position === 'r') newHeight = fixedHeight;

            // Enforce minimum size
            if (newWidth < minSize) {
                if (resizeHandle.position.includes('l')) newX = fixedX - minSize;
                newWidth = minSize;
            }
            if (newHeight < minSize) {
                 if (resizeHandle.position.includes('t')) newY = fixedY - minSize;
                newHeight = minSize;
            }
            
            obj.x = newX;
            obj.y = newY;
            obj.width = newWidth;
            obj.height = newHeight;

        } else if (obj.type === 'Circle') {
            // Calculate distance from center to mouse
            const dx = targetX - obj.x;
            const dy = targetY - obj.y;
            let newRadius = Math.sqrt(dx * dx + dy * dy);
            
            // Ensure radius doesn't go below minimum
            newRadius = Math.max(5, newRadius);
            
            if (snapToGrid) {
                 // Snap radius to the nearest half-grid size for diameter snapping
                 newRadius = Math.round(newRadius / halfGrid) * halfGrid;
                 newRadius = Math.max(halfGrid, newRadius); // Minimum radius is half grid size when snapping
            }
            
            obj.radius = newRadius;
        }
        
        // Note: We don't update dragStartX/Y here for resizing to keep deltas relative to initial click
        updatePropertiesPanel();
        draw();
        return;
    }
    
    // Update cursor based on resize handles
    if (currentTool === 'select' && !isDragging && !isSelecting && !isPanning) {
        const handle = checkResizeHandle(mousePos);
        if (handle) {
            canvas.style.cursor = handle.cursor;
        } else {
            canvas.style.cursor = 'default';
        }
    }
    
    // Handle panning
    if (isPanning) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        panOffset.x += deltaX;
        panOffset.y += deltaY;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        draw();
        return;
    }
    
    // Handle selection rectangle
    if (isSelecting) {
        selectionRect.width = mousePos.x - selectionRect.x;
        selectionRect.height = mousePos.y - selectionRect.y;
        draw();
        return;
    }
    
    // Handle dragging objects (Revised Snapping)
    if (isDragging && dragOffsets.length > 0) {
        dragOffsets.forEach(dragData => {
            const obj = dragData.obj;
            // Calculate target position based on current mouse and stored offset
            let targetX = mousePos.x - dragData.offsetX;
            let targetY = mousePos.y - dragData.offsetY;

            // Apply snapping if enabled
            if (snapToGrid) {
                targetX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
                targetY = Math.round(targetY / GRID_SIZE) * GRID_SIZE;
            }
            
            // Update object position
            if (obj.type === 'Rectangle' || obj.type === 'Circle' || obj.type === 'Point') {
                obj.x = targetX;
                obj.y = targetY;
            }
        });
        
        updatePropertiesPanel();
        draw();
    }
}

function handleMouseUp(e) {
    if (isPanning) {
        isPanning = false;
        canvas.style.cursor = isSpaceDown ? 'grab' : 'default';
    }
    
    if (isResizing) {
        isResizing = false;
        resizeHandle = null;
        canvas.style.cursor = 'default';
    }
    
    if (isSelecting) {
        isSelecting = false;
        
        // Normalize selection rectangle (handle negative width/height)
        const selX = selectionRect.width < 0 ? selectionRect.x + selectionRect.width : selectionRect.x;
        const selY = selectionRect.height < 0 ? selectionRect.y + selectionRect.height : selectionRect.y;
        const selWidth = Math.abs(selectionRect.width);
        const selHeight = Math.abs(selectionRect.height);
        
        // Select objects inside the selection rectangle
        objects.forEach(obj => {
            if (obj.type === 'Rectangle') {
                if (obj.x + obj.width >= selX && obj.x <= selX + selWidth &&
                    obj.y + obj.height >= selY && obj.y <= selY + selHeight) {
                    if (!selectedObjects.includes(obj)) {
                        selectedObjects.push(obj);
                    }
                }
            } else if (obj.type === 'Circle') {
                // Check if circle overlaps with selection rectangle
                const closestX = Math.max(selX, Math.min(obj.x, selX + selWidth));
                const closestY = Math.max(selY, Math.min(obj.y, selY + selHeight));
                const distX = obj.x - closestX;
                const distY = obj.y - closestY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                if (distance <= obj.radius) {
                    if (!selectedObjects.includes(obj)) {
                        selectedObjects.push(obj);
                    }
                }
            } else if (obj.type === 'Point') {
                // Check if point is inside selection rectangle
                if (obj.x >= selX && obj.x <= selX + selWidth &&
                    obj.y >= selY && obj.y <= selY + selHeight) {
                    if (!selectedObjects.includes(obj)) {
                        selectedObjects.push(obj);
                    }
                }
            }
        });
        
        updatePropertiesPanel();
        draw();
    }
    
    if (isDragging) {
        saveState(); // Save state after dragging ends
    }
    
    isDragging = false;
}

function handleKeyDown(e) {
    // Space bar for quick panning
    if (e.code === 'Space' && !isSpaceDown) {
        isSpaceDown = true;
        canvas.style.cursor = 'grab';
        e.preventDefault(); // Prevent page scrolling
    }
    
    // Copy selected objects (Ctrl+C)
    if (e.ctrlKey && e.key === 'c' && selectedObjects.length > 0) {
        clipboard = JSON.parse(JSON.stringify(selectedObjects)); // Deep copy
        console.log('Objects copied to clipboard:', clipboard.length);
    }
    
    // Paste objects (Ctrl+V)
    if (e.ctrlKey && e.key === 'v' && clipboard.length > 0) {
        saveState(); // Save state before pasting
        const newObjects = JSON.parse(JSON.stringify(clipboard)); // Deep copy
        
        // Offset pasted objects slightly
        newObjects.forEach(obj => {
            obj.x += 20;
            obj.y += 20;
            objects.push(obj);
        });
        
        selectedObjects = newObjects;
        updatePropertiesPanel();
        draw();
        console.log('Objects pasted from clipboard:', newObjects.length);
        saveState(); // Save state after pasting
    }
    
    // Delete selected objects (Delete key)
    if (e.key === 'Delete' && selectedObjects.length > 0) {
        saveState(); // Save state before deleting
        objects = objects.filter(obj => !selectedObjects.includes(obj));
        selectedObjects = [];
        updatePropertiesPanel();
        draw();
        saveState(); // Save state after deleting
    }
    
    // Zoom in with + or =
    if (e.key === '+' || e.key === '=') {
        zoomIn();
        e.preventDefault();
    }
    
    // Zoom out with -
    if (e.key === '-' || e.key === '_') {
        zoomOut();
        e.preventDefault();
    }
    
    // Rotate selected objects (R key)
    if (e.key === 'r' && selectedObjects.length > 0) {
        saveState(); // Save state before rotating
        rotateSelectedObjects(90); // Rotate 90 degrees counter-clockwise
        e.preventDefault(); // Prevent typing 'r' if in an input field? Maybe not needed.
        saveState(); // Save state after rotating
    }
    
    // Undo (Ctrl+Z)
    if (e.ctrlKey && e.key === 'z') {
        undo();
        e.preventDefault(); // Prevent browser undo
    }
}

function handleKeyUp(e) {
    // Release space bar
    if (e.code === 'Space') {
        isSpaceDown = false;
        if (!isPanning) {
            canvas.style.cursor = 'default';
        }
    }
}

function handleWheel(e) {
    // Zoom with mouse wheel
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomIn(e);
        } else {
            zoomOut(e);
        }
    }
}

function zoomIn(e) {
    const oldZoom = zoomLevel;
    zoomLevel = Math.min(zoomLevel * 1.1, 5); // Max zoom level of 5x
    
    // If we have mouse position, zoom toward that point
    if (e && e.clientX) {
        adjustPanForZoom(e, oldZoom);
    }
    
    draw();
}

function zoomOut(e) {
    const oldZoom = zoomLevel;
    zoomLevel = Math.max(zoomLevel / 1.1, 0.1); // Min zoom level of 0.1x
    
    // If we have mouse position, zoom toward that point
    if (e && e.clientX) {
        adjustPanForZoom(e, oldZoom);
    }
    
    draw();
}

function adjustPanForZoom(e, oldZoom) {
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Adjust pan offset to zoom toward mouse position
    panOffset.x = mouseX - (mouseX - panOffset.x) * (zoomLevel / oldZoom);
    panOffset.y = mouseY - (mouseY - panOffset.y) * (zoomLevel / oldZoom);
}

function updatePropertiesPanel() {
    propertiesPanel.innerHTML = ''; // Clear previous properties

    if (selectedObjects.length === 1) {
        const obj = selectedObjects[0];
        const props = Object.keys(obj);
        props.forEach(prop => {
            if (prop === 'type') return; // Don't allow changing type for now

            const propContainer = document.createElement('div');
            propContainer.style.marginBottom = '5px';

            const label = document.createElement('label');
            label.textContent = `${prop}: `;
            label.style.marginRight = '5px';

            let input;
            if (prop === 'color') {
                // Create a container for color and alpha
                const colorContainer = document.createElement('div');
                colorContainer.style.display = 'flex';
                colorContainer.style.alignItems = 'center';
                
                // Color picker
                input = document.createElement('input');
                input.type = 'color';
                input.value = obj[prop].startsWith('rgba') ? rgbaToHex(obj[prop]) : obj[prop];
                input.style.verticalAlign = 'middle';
                
                // Alpha slider
                const alphaLabel = document.createElement('span');
                alphaLabel.textContent = 'Alpha: ';
                alphaLabel.style.marginLeft = '10px';
                
                const alphaSlider = document.createElement('input');
                alphaSlider.type = 'range';
                alphaSlider.min = '0';
                alphaSlider.max = '1';
                alphaSlider.step = '0.01';
                alphaSlider.value = obj[prop].startsWith('rgba') ? getAlphaFromRgba(obj[prop]) : '1';
                
                // Update color when either input changes
                const updateColor = () => {
                    const hexColor = input.value;
                    const alpha = parseFloat(alphaSlider.value);
                    if (alpha < 1) {
                        // Convert hex to rgba
                        const r = parseInt(hexColor.slice(1, 3), 16);
                        const g = parseInt(hexColor.slice(3, 5), 16);
                        const b = parseInt(hexColor.slice(5, 7), 16);
                        obj[prop] = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    } else {
                        obj[prop] = hexColor;
                    }
                    draw();
                };
                
                input.addEventListener('change', () => {
                    saveState();
                    updateColor();
                    saveState();
                });
                
                alphaSlider.addEventListener('change', () => {
                    saveState();
                    updateColor();
                    saveState();
                });
                
                colorContainer.appendChild(input);
                colorContainer.appendChild(alphaLabel);
                colorContainer.appendChild(alphaSlider);
                
                propContainer.appendChild(label);
                propContainer.appendChild(colorContainer);
                propertiesPanel.appendChild(propContainer);
                return;
            } else {
                input = document.createElement('input');
                input.type = (typeof obj[prop] === 'number') ? 'number' : 'text';
                input.value = obj[prop];
                if (input.type === 'number') {
                    input.step = 'any'; // Allow decimals
                }
            }
            
            input.addEventListener('change', (e) => {
                saveState(); // Save state before property change
                obj[prop] = (input.type === 'number') ? parseFloat(e.target.value) : e.target.value;
                // If this is the tag input and a preset dropdown exists, sync dropdown
                if (prop === 'tag' && obj.type === 'Point') {
                    const presetDropdown = propertiesPanel.querySelector('.enemy-preset-dropdown');
                    if (presetDropdown) {
                        let foundMatch = false;
                        for (const option of presetDropdown.options) {
                            if (option.value === e.target.value) {
                                presetDropdown.value = e.target.value;
                                foundMatch = true;
                                break;
                            }
                        }
                        if (!foundMatch) {
                            presetDropdown.value = ""; // Reset to default if custom tag
                        }
                    }
                }
                draw(); // Redraw when properties change
                saveState(); // Save state after property change
            });

            propContainer.appendChild(label);
            propContainer.appendChild(input);
            propertiesPanel.appendChild(propContainer);

            // If the object is a Point and the property is 'tag', add the enemy preset dropdown
            if (obj.type === 'Point' && prop === 'tag') {
                const dropdownContainer = document.createElement('div');
                dropdownContainer.style.marginTop = '5px';

                const dropdownLabel = document.createElement('label');
                dropdownLabel.textContent = 'Enemy Preset: ';
                dropdownLabel.style.marginRight = '5px';

                const selectDropdown = document.createElement('select');
                selectDropdown.className = 'enemy-preset-dropdown'; // Add a class for potential styling or selection

                // Add a default option
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "-- Select Enemy --";
                selectDropdown.appendChild(defaultOption);

                // Populate with enemy tags
                for (const enemyName in enemyTags) {
                    const option = document.createElement('option');
                    option.value = enemyTags[enemyName];
                    option.textContent = enemyName;
                    selectDropdown.appendChild(option);
                }

                // Set current value
                selectDropdown.value = obj.tag || "";

                selectDropdown.addEventListener('change', (e) => {
                    saveState();
                    const newTag = e.target.value;
                    obj.tag = newTag;
                    // Update the text input field as well
                    if (input && input.type === 'text') { // input here is the tag text input
                        input.value = newTag;
                    }
                    draw();
                    saveState();
                });

                dropdownContainer.appendChild(dropdownLabel);
                dropdownContainer.appendChild(selectDropdown);
                propContainer.appendChild(dropdownContainer); // Append to the tag's property container
            }
        });
    } else if (selectedObjects.length > 1) {
        propertiesPanel.innerHTML = `<p>Multiple objects selected (${selectedObjects.length})</p>`;
        
        // Add common properties that can be edited for multiple objects (e.g., color)
        const commonProps = ['color'];
        commonProps.forEach(prop => {
             if (selectedObjects.every(o => o.hasOwnProperty(prop))) { // Ensure all selected have the prop
                const propContainer = document.createElement('div');
                propContainer.style.marginBottom = '5px';

                const label = document.createElement('label');
                label.textContent = `${prop}: `;
                label.style.marginRight = '5px';

                let input;
                 if (prop === 'color') {
                    // Create a container for color and alpha
                    const colorContainer = document.createElement('div');
                    colorContainer.style.display = 'flex';
                    colorContainer.style.alignItems = 'center';
                    
                    // Color picker
                    input = document.createElement('input');
                    input.type = 'color';
                    
                    // Try to set a common value, or default if different
                    const firstColor = selectedObjects[0][prop];
                    const isCommonColor = selectedObjects.every(o => o[prop] === firstColor);
                    input.value = isCommonColor ? (firstColor.startsWith('rgba') ? rgbaToHex(firstColor) : firstColor) : '#ffffff';
                    input.style.verticalAlign = 'middle';
                    
                    // Alpha slider
                    const alphaLabel = document.createElement('span');
                    alphaLabel.textContent = 'Alpha: ';
                    alphaLabel.style.marginLeft = '10px';
                    
                    const alphaSlider = document.createElement('input');
                    alphaSlider.type = 'range';
                    alphaSlider.min = '0';
                    alphaSlider.max = '1';
                    alphaSlider.step = '0.01';
                    alphaSlider.value = isCommonColor && firstColor.startsWith('rgba') ? getAlphaFromRgba(firstColor) : '1';
                    
                    // Update color for all selected objects
                    const updateColor = () => {
                        const hexColor = input.value;
                        const alpha = parseFloat(alphaSlider.value);
                        
                        selectedObjects.forEach(obj => {
                            if (alpha < 1) {
                                // Convert hex to rgba
                                const r = parseInt(hexColor.slice(1, 3), 16);
                                const g = parseInt(hexColor.slice(3, 5), 16);
                                const b = parseInt(hexColor.slice(5, 7), 16);
                                obj[prop] = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                            } else {
                                obj[prop] = hexColor;
                            }
                        });
                        draw();
                    };
                    
                    input.addEventListener('change', () => {
                        saveState();
                        updateColor();
                        saveState();
                    });
                    
                    alphaSlider.addEventListener('change', () => {
                        saveState();
                        updateColor();
                        saveState();
                    });
                    
                    colorContainer.appendChild(input);
                    colorContainer.appendChild(alphaLabel);
                    colorContainer.appendChild(alphaSlider);
                    
                    propContainer.appendChild(label);
                    propContainer.appendChild(colorContainer);
                    propertiesPanel.appendChild(propContainer);
                    return;
                 } else {
                    // Handle other common properties if needed
                 }

                if (input) {
                    input.addEventListener('change', (e) => {
                        saveState();
                        selectedObjects.forEach(obj => {
                            obj[prop] = e.target.value;
                        });
                        draw();
                        saveState();
                    });
                    propContainer.appendChild(label);
                    propContainer.appendChild(input);
                    propertiesPanel.appendChild(propContainer);
                }
            }
        });

    } else {
        propertiesPanel.innerHTML = '<p>Select an object to edit properties.</p>';
    }
}

// Helper functions for color conversion
function rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getAlphaFromRgba(rgba) {
    const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*(?:\.\d+)?)\)/);
    return match ? match[4] : '1';
}

function setTool(tool) {
    currentTool = tool;
    canvas.style.cursor = tool === 'pan' ? 'grab' : 'default';
    
    // Update UI to show active tool
    document.querySelectorAll('.tool-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
}

function exportLevel() {
    // Adjust object positions to account for pan offset
    const exportObjects = objects.map(obj => {
        const exportObj = { ...obj };
        return exportObj;
    });
    
    const levelData = { objects: exportObjects };
    const dataStr = JSON.stringify(levelData, null, 2); // Pretty print JSON

    // Create a blob and download link
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Level exported:", dataStr);
}

function importLevel(file) {
    if (!file) {
        console.error("No file selected.");
        return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            const levelData = JSON.parse(event.target.result);

            if (!levelData || !Array.isArray(levelData.objects)) {
                console.error("Invalid level format: 'objects' array not found.");
                alert("Invalid level file format."); // User feedback
                return;
            }

            // Load the level data
            objects = levelData.objects; 
            selectedObjects = []; // Clear selection
            panOffset = { x: 0, y: 0 }; // Reset pan
            zoomLevel = 1; // Reset zoom
            actionHistory = []; // Reset history
            historyIndex = -1;
            saveState(); // Save the initial imported state
            draw();
            updatePropertiesPanel();
            console.log("Level imported successfully.");
            // Reset the file input value to allow importing the same file again
            importFileInput.value = null; 

        } catch (error) {
            console.error("Error parsing level file:", error);
            alert("Error reading or parsing the level file. Make sure it's valid JSON.");
            importFileInput.value = null; // Reset input even on error
        }
    };

    reader.onerror = (event) => {
        console.error("Error reading file:", event.target.error);
        alert("Error reading the selected file.");
        importFileInput.value = null; // Reset input on error
    };

    reader.readAsText(file);
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
document.addEventListener('DOMContentLoaded', async () => { // Make async
    await loadEnemyTags(); // Load enemy tags before initializing the rest
    resizeCanvas(); // Initial resize and draw
    saveState(); // Save initial empty state
    
    // Add spawn point at (0,0)
    objects.push({ type: 'Point', x: 0, y: 0, tag: 'spawn', color: 'yellow' });

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Snap toggle listener
    snapToggle.addEventListener('change', (e) => {
        snapToGrid = e.target.checked;
        console.log("Snap to grid:", snapToGrid);
    });

    // Sidebar object selection
    objectList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            if (e.target.getAttribute('data-tool')) {
                setTool(e.target.getAttribute('data-tool'));
            } else if (e.target.getAttribute('data-type')) {
                currentObjectType = e.target.getAttribute('data-type');
                setTool('create');
                console.log(`Selected object type: ${currentObjectType}`);
            }
        }
    });

    exportButton.addEventListener('click', exportLevel);
    
    // Add tool buttons if they don't exist yet
    if (!document.querySelector('[data-tool="select"]')) {
        const toolsDiv = document.createElement('div');
        toolsDiv.className = 'tools';
        toolsDiv.innerHTML = `
            <button class="tool-button active" data-tool="create">Create</button>
            <button class="tool-button" data-tool="select">Select</button>
            <button class="tool-button" data-tool="pan">Pan</button>
        `;
        objectList.parentNode.insertBefore(toolsDiv, objectList);
        
        toolsDiv.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.getAttribute('data-tool')) {
                setTool(e.target.getAttribute('data-tool'));
            }
        });
    }
    
    // Add zoom controls
    if (!document.querySelector('.zoom-controls')) {
        const zoomDiv = document.createElement('div');
        zoomDiv.className = 'zoom-controls';
        zoomDiv.innerHTML = `
            <button id="zoom-in">+</button>
            <span id="zoom-level">100%</span>
            <button id="zoom-out">-</button>
        `;
        document.body.appendChild(zoomDiv);
        
        document.getElementById('zoom-in').addEventListener('click', () => zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => zoomOut());
        
        // Update zoom level display
        const zoomLevelSpan = document.getElementById('zoom-level');
        const updateZoomDisplay = () => {
            zoomLevelSpan.textContent = `${Math.round(zoomLevel * 100)}%`;
        };
        // Update immediately and also set interval
        updateZoomDisplay(); 
        setInterval(updateZoomDisplay, 200); // Update slightly less often
    }

    // Import Button Listener
    importButton.addEventListener('click', () => {
        importFileInput.click(); // Trigger the hidden file input
    });

    // File Input Change Listener
    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            importLevel(file);
        }
    });
});

// Initial draw
resizeCanvas();

// Helper function to calculate the center of a group of objects
function getGroupCenter(objectGroup) {
    if (!objectGroup || objectGroup.length === 0) {
        return { x: 0, y: 0 };
    }

    if (objectGroup.length === 1) {
        const obj = objectGroup[0];
        if (obj.type === 'Rectangle') {
            return { x: obj.x + obj.width / 2, y: obj.y + obj.height / 2 };
        } else { // Circle or Point
            return { x: obj.x, y: obj.y };
        }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    objectGroup.forEach(obj => {
        let objMinX, objMinY, objMaxX, objMaxY;
        if (obj.type === 'Rectangle') {
            objMinX = obj.x;
            objMinY = obj.y;
            objMaxX = obj.x + obj.width;
            objMaxY = obj.y + obj.height;
        } else if (obj.type === 'Circle') {
            objMinX = obj.x - obj.radius;
            objMinY = obj.y - obj.radius;
            objMaxX = obj.x + obj.radius;
            objMaxY = obj.y + obj.radius;
        } else { // Point
            objMinX = obj.x;
            objMinY = obj.y;
            objMaxX = obj.x;
            objMaxY = obj.y;
        }
        minX = Math.min(minX, objMinX);
        minY = Math.min(minY, objMinY);
        maxX = Math.max(maxX, objMaxX);
        maxY = Math.max(maxY, objMaxY);
    });

    return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
}

function rotateSelectedObjects(degrees) {
    if (selectedObjects.length === 0) return;

    const angleRad = degrees * (Math.PI / 180); // Convert degrees to radians
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const groupCenter = getGroupCenter(selectedObjects);

    selectedObjects.forEach(obj => {
        let objCenterX, objCenterY;

        // Calculate object's current center
        if (obj.type === 'Rectangle') {
            objCenterX = obj.x + obj.width / 2;
            objCenterY = obj.y + obj.height / 2;
        } else { // Circle or Point
            objCenterX = obj.x;
            objCenterY = obj.y;
        }

        // Calculate position relative to group center
        const relX = objCenterX - groupCenter.x;
        const relY = objCenterY - groupCenter.y;

        // Rotate the relative position
        // Using 90-degree rotation matrix: x' = -y, y' = x
        const rotatedRelX = -relY; // relX * cos - relY * sin; (For 90deg, cos=0, sin=1)
        const rotatedRelY = relX;  // relX * sin + relY * cos; (For 90deg, cos=0, sin=1)

        // Calculate new absolute center position
        const newCenterX = groupCenter.x + rotatedRelX;
        const newCenterY = groupCenter.y + rotatedRelY;

        // Update object position based on new center
        if (obj.type === 'Rectangle') {
            // Swap width and height for 90-degree rotation
            const oldWidth = obj.width;
            obj.width = obj.height;
            obj.height = oldWidth;
            // Recalculate top-left corner from the new center and dimensions
            obj.x = newCenterX - obj.width / 2;
            obj.y = newCenterY - obj.height / 2;
        } else { // Circle or Point
            obj.x = newCenterX;
            obj.y = newCenterY;
        }
    });

    updatePropertiesPanel(); // Update panel if dimensions changed
    draw();
}
