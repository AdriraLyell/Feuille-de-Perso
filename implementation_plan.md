# Implementation Plan: Free Movement for Journal Images

## Goal
Enable users to position journal images freely on the page using drag and drop, while maintaining the existing columnar layout for regular text.

## Proposed Changes

### 1. Tiptap Extension (`src/extensions/bookImage.ts`)
- Add `offsetX` and `offsetY` to `BookImageAttributes`.
- Update `addAttributes` to include these with default values of `0`.
- Update `align` attribute to include `'free'`.

### 2. React NodeView (`src/components/campaign/book/BookImageView.tsx`)
- Add `'drag-free'` interaction mode.
- Update `style` to use `transform: translate(offsetX, offsetY)` when in `free` mode.
- Update UI to include "Free" alignment button.
- Add drag handling for free movement using `activeInteraction`.
- Add a "Reset Position" button.

## Verification Plan

### Manual Tests
1. **Free Alignment**:
   - Select an image and click "F" (Free).
   - Drag the image to different positions.
   - Switch back to "C" (Center) and verify it returns to flow.
   - Switch back to "F" and verify it remembers its last offset.
2. **Persistence**:
   - Move an image, save/reload and verify position persists.

### Automatic Validation
- `npm run build` to ensure no TypeScript or JSX errors.
