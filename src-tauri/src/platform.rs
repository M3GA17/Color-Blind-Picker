#[derive(Debug, Clone, Copy)]
pub struct ScreenPoint {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug)]
pub struct DesktopBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[cfg(windows)]
mod windows {
    use super::*;
    use std::ptr::null_mut;
    use windows_sys::Win32::{
        Foundation::POINT,
        Graphics::Gdi::{GetDC, GetPixel, ReleaseDC, CLR_INVALID},
        UI::WindowsAndMessaging::{
            GetCursorPos, GetSystemMetrics, SM_CXVIRTUALSCREEN, SM_CYVIRTUALSCREEN,
            SM_XVIRTUALSCREEN, SM_YVIRTUALSCREEN,
        },
    };

    pub fn cursor() -> Result<ScreenPoint, String> {
        let mut point = POINT { x: 0, y: 0 };
        // Windows initializes the writable POINT; no pointers escape this call.
        if unsafe { GetCursorPos(&mut point) } == 0 {
            return Err("Cannot read the pointer position.".into());
        }
        Ok(ScreenPoint {
            x: point.x,
            y: point.y,
        })
    }

    pub fn pixel(point: ScreenPoint) -> Result<[u8; 3], String> {
        // A desktop DC uses physical virtual-desktop coordinates, including negative monitor origins.
        let dc = unsafe { GetDC(null_mut()) };
        if dc.is_null() {
            return Err("Cannot access the desktop.".into());
        }
        let value = unsafe { GetPixel(dc, point.x, point.y) };
        // Release the same DC even when GetPixel fails.
        unsafe {
            ReleaseDC(null_mut(), dc);
        }
        if value == CLR_INVALID {
            return Err("Cannot sample this screen pixel.".into());
        }
        Ok([value as u8, (value >> 8) as u8, (value >> 16) as u8])
    }

    pub fn bounds() -> Result<DesktopBounds, String> {
        let bounds = unsafe {
            DesktopBounds {
                x: GetSystemMetrics(SM_XVIRTUALSCREEN),
                y: GetSystemMetrics(SM_YVIRTUALSCREEN),
                width: GetSystemMetrics(SM_CXVIRTUALSCREEN) as u32,
                height: GetSystemMetrics(SM_CYVIRTUALSCREEN) as u32,
            }
        };
        if bounds.width == 0 || bounds.height == 0 {
            return Err("No screen is available.".into());
        }
        Ok(bounds)
    }

    pub fn copy(text: String) -> Result<(), String> {
        let mut clipboard =
            arboard::Clipboard::new().map_err(|e| format!("Cannot open clipboard: {e}"))?;
        clipboard
            .set_text(text)
            .map_err(|e| format!("Cannot copy this color: {e}"))
    }
}

#[cfg(windows)]
pub use windows::*;

#[cfg(not(windows))]
mod unsupported {
    use super::*;
    const MESSAGE: &str = "Screen sampling is currently supported on Windows only.";
    pub fn cursor() -> Result<ScreenPoint, String> {
        Err(MESSAGE.into())
    }
    pub fn pixel(_: ScreenPoint) -> Result<[u8; 3], String> {
        Err(MESSAGE.into())
    }
    pub fn bounds() -> Result<DesktopBounds, String> {
        Err(MESSAGE.into())
    }
    pub fn copy(_: String) -> Result<(), String> {
        Err(MESSAGE.into())
    }
}

#[cfg(not(windows))]
pub use unsupported::*;
