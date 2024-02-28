using ColorBlindPicker.ApplicationLayer.ViewModels;
using ColorBlindPicker.BusinessLayer.Extensions;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows;
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
        Interval = new TimeSpan(50)
    };

    MainWindowViewModel viewModel;
    public MainWindow()
    {
        InitializeComponent();
        MouseMoveTimer.Tick += MouseMoveTimer_Tick;
    }
    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        viewModel = (MainWindowViewModel)DataContext;

        //set window on right site
        double screenWidth = SystemParameters.PrimaryScreenWidth;

        double xPosition = screenWidth - Width;
        double yPosition = 20;

        Left = xPosition;
        Top = yPosition;

        MouseMoveTimer.Start();
    }
    private void MouseMoveTimer_Tick(object? sender, EventArgs e)
    {
        Drawing.Point mousePoint = new();
        GetCursorPos(ref mousePoint);
        viewModel.Color = GetColorAt(mousePoint);
        viewModel.HslColor = viewModel.Color.ConvertToHsl();
        Quadrato.Background = viewModel.Color.ConvertToSolidColorBrush();
    }
    public Color GetColorAt(Drawing.Point location)
    {
        using (Graphics gdest = Graphics.FromImage(screenPixel))
        {
            using Graphics gsrc = Graphics.FromHwnd(IntPtr.Zero);
            IntPtr hSrcDC = gsrc.GetHdc();
            IntPtr hDC = gdest.GetHdc();
            int retval = BitBlt(hDC, 0, 0, 1, 1, hSrcDC, location.X, location.Y, (int)Drawing.CopyPixelOperation.SourceCopy);
            gdest.ReleaseHdc();
            gsrc.ReleaseHdc();
        }

        return screenPixel.GetPixel(0, 0);
    }

    private void DragMove(object sender, System.Windows.Input.MouseButtonEventArgs e)
    {
        DragMove();
    }
}