using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace ColorBlindPicker.BusinessLayer.Services;
public class MouseHookManager
{
    private const int WH_MOUSE_LL = 14;
    private const int WM_LBUTTONDOWN = 0x0201;

    private delegate nint LowLevelMouseProc(int nCode, nint wParam, nint lParam);
    private LowLevelMouseProc mouseProc;
    private nint hookId = nint.Zero;

    public event EventHandler MouseClickOutside;

    public void Start()
    {
        mouseProc = HookCallback;
        hookId = SetHook(mouseProc);
    }

    public void Stop()
    {
        UnhookWindowsHookEx(hookId);
    }

    private nint SetHook(LowLevelMouseProc proc)
    {
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule)
        {
            return SetWindowsHookEx(WH_MOUSE_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
    }

    private nint HookCallback(int nCode, nint wParam, nint lParam)
    {
        if (nCode >= 0 && wParam == WM_LBUTTONDOWN)
        {
            MouseClickOutside?.Invoke(this, EventArgs.Empty);
        }

        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }

    #region Interop Declarations
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern nint SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, nint hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(nint hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern nint CallNextHookEx(nint hhk, int nCode, nint wParam, nint lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern nint GetModuleHandle(string lpModuleName);
    #endregion
}

