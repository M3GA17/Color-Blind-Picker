using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.ApplicationLayer.ViewModels;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using Drawing = System.Drawing;

namespace ColorBlindPicker;

public partial class MainWindow : Window
{
    [LibraryImport("gdi32.dll", SetLastError = true)]
    public static partial int BitBlt(IntPtr hDC, int x, int y, int nWidth, int nHeight, IntPtr hSrcDC, int xSrc, int ySrc, int dwRop);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GetCursorPos(ref Drawing.Point lpPoint);

    readonly Bitmap screenPixel = new(1, 1, Drawing.Imaging.PixelFormat.Format32bppArgb);

    readonly DispatcherTimer MouseMoveTimer = new()
    {
        Interval = TimeSpan.FromMilliseconds(10)
    };

    MainWindowViewModel viewModel = new();
    public MainWindow()
    {
        InitializeComponent();
        MouseMoveTimer.Tick += MouseMoveTimer_Tick;
    }
    private async void Window_Loaded(object sender, RoutedEventArgs e)
    {
        viewModel = (MainWindowViewModel)DataContext;
        SetWindowsPositionAndFlags();
        await Task.Run(MouseMoveTimer.Start);
    }
    private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e) => SaveWindowsPositionAndFlags();

    private void DragMove(object sender, System.Windows.Input.MouseButtonEventArgs e) => DragMove();
    private void CloseButton_Click(object sender, RoutedEventArgs e) => Application.Current.Shutdown();

    private void ColorPanel_DeleteCommand(object sender, EventArgs e)
    {
        Button panel = (Button)sender;
        viewModel.FileService.RemoveColor((ColorModel)panel.DataContext);
    }
    private async void MouseMoveTimer_Tick(object? sender, EventArgs e)
    {
        Drawing.Point mousePoint = new();
        GetCursorPos(ref mousePoint);
        viewModel.ColorModel.Color = await Task.Run(() => GetColorAt(mousePoint));
    }
    public Color GetColorAt(Drawing.Point location)
    {
        try
        {
            using (Graphics gdest = Graphics.FromImage(screenPixel))
            using (Graphics gsrc = Graphics.FromHwnd(IntPtr.Zero))
            {
                IntPtr hSrcDC = gsrc.GetHdc();
                IntPtr hDC = gdest.GetHdc();
                int retval = BitBlt(hDC, 0, 0, 1, 1, hSrcDC, location.X, location.Y, (int)Drawing.CopyPixelOperation.SourceCopy);
                gdest.ReleaseHdc();
                gsrc.ReleaseHdc();
            }

            return screenPixel.GetPixel(0, 0);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Errore durante la lettura del colore: {ex.Message}"); // will be log
            return Color.Transparent;
        }
    }
    public void SaveWindowsPositionAndFlags()
    {
        Properties.Settings.Default.Top = Top;
        Properties.Settings.Default.Left = Left;
        Properties.Settings.Default.AlwaysOnTop = viewModel.AlwaysOnTop;
        Properties.Settings.Default.ViewHistory = viewModel.ViewHistory;
        Properties.Settings.Default.Save();
    }
    public void SetWindowsPositionAndFlags()
    {
        viewModel.AlwaysOnTop = Properties.Settings.Default.AlwaysOnTop;
        viewModel.ViewHistory = Properties.Settings.Default.ViewHistory;
        Top = Properties.Settings.Default.Top;
        Left = Properties.Settings.Default.Left;
    }
}