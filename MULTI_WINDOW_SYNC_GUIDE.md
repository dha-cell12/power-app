# Multi-Window Synchronization Guide

## 📋 Overview

The Multi-Window Synchronization feature allows you to synchronize mouse and keyboard operations from a master window to multiple slave windows in real-time, enabling batch operations and automated control.

## ✨ Features

### Phase 1: MVP Base Version
- ✅ **Mouse Event Sync**: Movement, click, right-click
- ✅ **Keyboard Input Sync**: Key press and release
- ✅ **Master-Slave Management**: Support for one master window controlling multiple slave windows
- ✅ **Relative Coordinate Mapping**: Automatic adaptation to different window sizes

### Phase 2: Enhanced Version
- ✅ **Extension Window Sync**: Support for browser extension pop-up windows
- ✅ **Wheel Event Optimization**: Tiered scrolling strategy, intelligent handling of small, medium, and large scrolls
- ✅ **Event Filtering and Throttling**: Configurable throttling parameters to reduce system load
- ✅ **CDP Page Scroll Sync**: Precisely synchronize page scroll position via Chrome DevTools Protocol

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

The project will automatically install the `uiohook-napi` dependency.

### 2. Compile Native Addon

```bash
# Windows
npm run build:native-addon

# macOS (x64)
npm run build:native-addon:mac-x64

# macOS (arm64)
npm run build:native-addon:mac-arm64
```

### 3. Start Application

```bash
npm run watch
```

## 📖 API Usage

### Calling from Renderer Process

```typescript
// Start synchronization
const result = await ipcRenderer.invoke('multi-window-sync-start', {
  masterWindowId: 1,      // Master window ID
  slaveWindowIds: [2, 3, 4], // Array of slave window IDs
  options: {              // Optional configuration
    enableMouseSync: true,
    enableKeyboardSync: true,
    enableWheelSync: true,
    enableCdpSync: false,  // CDP sync requires windows to have debug ports open
    mouseMoveThrottleMs: 10,
    mouseMoveThresholdPx: 2,
    wheelThrottleMs: 50,
    cdpSyncIntervalMs: 100
  }
});

if (result.success) {
  console.log('Synchronization started');
} else {
  console.error('Start failed:', result.error);
}

// Stop synchronization
await ipcRenderer.invoke('multi-window-sync-stop');

// Get synchronization status
const status = await ipcRenderer.invoke('multi-window-sync-status');
console.log(status);
// Output: { isActive: true, masterPid: 12345, slavePids: [23456, 34567] }
```

### Configuration Options Description

| Option | Type | Default | Description |
|------|------|---------|-------------|
| `enableMouseSync` | boolean | true | Enable mouse event synchronization |
| `enableKeyboardSync` | boolean | true | Enable keyboard event synchronization |
| `enableWheelSync` | boolean | true | Enable wheel event synchronization |
| `enableCdpSync` | boolean | false | Enable CDP page scroll synchronization |
| `mouseMoveThrottleMs` | number | 10 | Mouse move event throttle time (ms) |
| `mouseMoveThresholdPx` | number | 2 | Mouse move distance threshold (pixels) |
| `wheelThrottleMs` | number | 50 | Wheel event throttle time (ms) |
| `cdpSyncIntervalMs` | number | 100 | CDP synchronization polling interval (ms) |

## 🔧 Technical Implementation

### Architecture Design

```
┌─────────────────────────────────────────────────┐
│           Electron Main Process                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Event Capture Layer (uiohook-napi)       │  │
│  │  - Global Keyboard Hook                   │  │
│  │  - Global Mouse Hook                      │  │
│  └──────────────┬───────────────────────────┘  │
│                 │ Event Stream                   │
│  ┌──────────────▼───────────────────────────┐  │
│  │  Event Processing & Distribution (TS)     │  │
│  │  - Filtering & Throttling                 │  │
│  │  - Coordinate Transformation              │  │
│  │  - Master-Slave Management                │  │
│  └──────────────┬───────────────────────────┘  │
│                 │ Distribution                   │
│  ┌──────────────▼───────────────────────────┐  │
│  │  Window Message Sending (Native Addon)    │  │
│  │  - Windows: PostMessage                  │  │
│  │  - macOS: CGEvent API                    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │              │              │
    ┌────▼────┐    ┌───▼────┐    ┌───▼────┐
    │Chrome 1 │    │Chrome 2│    │Chrome 3│
    │(Master) │    │(Slave) │    │(Slave) │
    └─────────┘    └────────┘    └────────┘
```

### Core Algorithms

#### 1. Relative Coordinate Mapping

```typescript
// Calculate relative position in master window
ratioX = (mouseX - masterWindow.x) / masterWindow.width
ratioY = (mouseY - masterWindow.y) / masterWindow.height

// Apply to slave window
slaveX = slaveWindow.x + (ratioX * slaveWindow.width)
slaveY = slaveWindow.y + (ratioY * slaveWindow.height)
```

#### 2. Wheel Event Tiered Handling

```typescript
if (absAmount <= 1) {
  // Small scroll: keep as is
  delta = amount
} else if (absAmount <= 3) {
  // Medium scroll: scale by 1.5x
  delta = amount * 1.5
} else {
  // Large scroll: scale by 2.0x
  delta = amount * 2.0
}
```

#### 3. Mouse Move Throttling

```typescript
// Double throttling: Time + Distance
if (timeDiff < 10ms && distance < 2px) {
  // Ignore this movement
  return
}
```

## 🎯 Use Cases

1. **Multi-Account Management**: Control multiple browser accounts simultaneously for the same operations.
2. **Batch Testing**: Synchronize testing workflows across multiple environments.
3. **Automated Demos**: Show operations across multiple windows simultaneously.
4. **Data Collection**: Execute the same data collection tasks in batch.

## ⚠️ Notes

### Windows Platform
- Requires **Administrator Privileges** to use global hooks.
- Some security software may block global hooks.

### macOS Platform
- Requires **Accessibility Permissions**.
- Will automatically prompt on first run; please follow the instructions.
- Can be manually authorized in `System Preferences > Security & Privacy > Privacy > Accessibility`.

### CDP Synchronization
- Requires windows to have debug ports open at startup.
- Ensure the `debug_port` field is correctly set in the database.
- CDP synchronization is more precise than event synchronization but has slightly higher overhead.

## 🐛 Troubleshooting

### 1. Synchronization Fails to Start

**Issue**: Calling `multi-window-sync-start` returns failure.

**Solutions**:
- Check if all windows are running (have a PID).
- Check if necessary system permissions are granted.
- View main process logs for detailed error messages.

### 2. Mouse/Keyboard Events Not Synchronizing

**Issue**: Events are captured but not distributed.

**Solutions**:
- Ensure the mouse is operating inside the master window.
- Check if `enableMouseSync` / `enableKeyboardSync` is enabled.
- Try adjusting the throttling parameters.

### 3. Wheel Synchronization Not Smooth

**Issue**: Scrolling is laggy or unresponsive.

**Solutions**:
- Adjust the `wheelThrottleMs` parameter (lower value to increase responsiveness).
- Check system resource usage.
- Try disabling CDP synchronization to reduce overhead.

### 4. Events Not Captured on macOS

**Issue**: Events are completely not working.

**Solutions**:
```bash
# Check accessibility permissions
# System Preferences > Security & Privacy > Privacy > Accessibility
# Ensure Chrome Power or Electron is added to the list
```

## 📊 Performance Optimization Suggestions

1. **Reduce number of synced windows**: The more windows synced simultaneously, the higher the performance overhead.
2. **Adjust throttling parameters**: Adjust event throttling time based on actual needs.
3. **Selectively enable features**: If you don't need wheel or keyboard sync, disable them to reduce overhead.
4. **Use CDP as needed**: Only enable CDP when precise page synchronization is required.

## 🔮 Future Plans

- [ ] Recording and playback functionality
- [ ] Custom synchronization rules (selectively sync specific operations)
- [ ] Multi-master window mode
- [ ] Delay and randomization of sync actions (simulate human behavior)
- [ ] UI integration (graphical configuration interface)

## 📝 Changelog

### v1.0.0 (2025-01-12)
- ✅ Implemented basic mouse, keyboard, and wheel event synchronization
- ✅ Added master-slave window management
- ✅ Implemented extension window monitoring
- ✅ Added wheel event optimization strategy
- ✅ Implemented event filtering and throttling
- ✅ Integrated CDP page scroll synchronization

## 🤝 Contribution

Issues and Pull Requests are welcome!

## 📄 License

This feature follows the project's AGPL license.
