using ColorBlindPicker.Models;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Threading;
using Drawing = System.Drawing;
using Media = System.Windows.Media;


namespace ColorBlindPicker;

public partial class MainWindow : Window
{
    [LibraryImport("gdi32.dll", SetLastError = true)]
    public static partial int BitBlt(IntPtr hDC, int x, int y, int nWidth, int nHeight, IntPtr hSrcDC, int xSrc, int ySrc, int dwRop);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GetCursorPos(ref Drawing.Point lpPoint);

    readonly Drawing.Bitmap screenPixel = new(1, 1, Drawing.Imaging.PixelFormat.Format32bppArgb);


    Dictionary<string, double> HueValues = new()
    {
        {"Rosso", 0},
        {"Rosso aranciato", 15},
        {"Arancione", 30},
        {"Giallo aranciato", 45},
        {"Giallo", 60},
        {"Verde giallognolo", 75},
        {"Verde", 120},
        {"Blu verdastro", 195},
        {"Blu", 240},
        {"Blu violaceo", 255},
        {"Viola", 270},
        {"Rosso violaceo", 315}
    };
    Dictionary<string, double> SaturationValues = new()
    {
        {"Grigio", 0},
        {"Tendente al grigio", 0.25},
        {"Sbiadito", 0.50},
        {"Leggermente sbiadito", 0.75},
        {"Normale", 1}
    };
    Dictionary<string, double> BrightnessValues = new()
    {
        {"Nero", 0.0},
        {"Scuro", 0.25},
        {"Normale", 0.50},
        {"Chiaro", 0.75},
        {"Bianco", 1}
    };


    readonly DispatcherTimer MouseMoveTimer = new()
    {
        Interval = new TimeSpan(50)
    };

    public MainWindow()
    {
        InitializeComponent();
        MouseMoveTimer.Tick += MouseMoveTimer_Tick;
    }

    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        double screenWidth = SystemParameters.PrimaryScreenWidth;

        // Calcola le coordinate per posizionare la finestra
        double xPosition = screenWidth - Width;
        double yPosition = 20; // 2 centimetri dal bordo superiore

        // Imposta la posizione della finestra
        Left = xPosition;
        Top = yPosition;

        MouseMoveTimer.Start();
    }


    private void MouseMoveTimer_Tick(object? sender, EventArgs e)
    {
        Drawing.Point mousePoint = new();
        GetCursorPos(ref mousePoint);
        Drawing.Color color = GetColorAt(mousePoint);
        Media.Color wpfColor = Media.Color.FromRgb(color.R, color.G, color.B);
        HslModel hsl = ColorToHsl(wpfColor);

        TxtColor.Text = FindColor(hsl);
        TxtRGB.Text = color.Name.Remove(0, 2);

        txtHSL_H.Text = hsl.Hue.ToString();
        txtHSL_S.Text = hsl.Saturation.ToString();
        txtHSL_L.Text = hsl.Lightness.ToString();

        Quadrato.Background = new Media.SolidColorBrush(Media.Color.FromArgb(color.A, color.R, color.G, color.B));
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


    string FindColor(HslModel hsl)
    {
        string hue = FindClosestValue(hsl.Hue, HueValues);
        string saturation = FindClosestValue(hsl.Saturation, SaturationValues);
        string lightness = FindClosestValue(hsl.Lightness, BrightnessValues);

        if (lightness == "Nero" || lightness == "Bianco")
            return lightness;

        if (saturation == "Grigio")
            return saturation;

        return string.Concat(hue, " ", lightness, " ", saturation);
    }


    static string FindClosestValue(double numberToSearch, Dictionary<string, double> Values)
    {
        if (Values == null || Values.Count == 0)
        {
            throw new ArgumentException("Brightness values dictionary is empty or null.");
        }

        string closestSymbolicName = null;
        double minDifference = double.MaxValue;

        foreach (var kvp in Values)
        {
            double currentDifference = Math.Abs(numberToSearch - kvp.Value);

            if (currentDifference < minDifference)
            {
                minDifference = currentDifference;
                closestSymbolicName = kvp.Key;
            }
        }

        return closestSymbolicName;
    }
    string FindCloser(float numToFind, Dictionary<string, double> dictionary)
    {
        double differenceMinimum = double.MaxValue;
        string text = "";

        foreach (var coppia in dictionary)
        {
            double differenza = Math.Abs(coppia.Value - numToFind);

            if (differenza < differenceMinimum)
            {
                differenceMinimum = differenza;
                text = coppia.Key;
            }
        }

        return text;
    }
    static HslModel ColorToHsl(Media.Color color)
    {
        HslModel colorHsl = new();

        float r = color.R / 255.0f;
        float g = color.G / 255.0f;
        float b = color.B / 255.0f;

        float min = Math.Min(Math.Min(r, g), b);
        float max = Math.Max(Math.Max(r, g), b);

        colorHsl.Lightness = (min + max) / 2;

        if (min == max)
        {
            colorHsl.Hue = 0;
            colorHsl.Saturation = 0;
        }
        else
        {
            colorHsl.Saturation = (colorHsl.Lightness < 0.5) ? (max - min) / (max + min) : (max - min) / (2.0f - max - min);

            if (max == r)
                colorHsl.Hue = (g - b) / (max - min);
            else if (max == g)
                colorHsl.Hue = 2.0f + (b - r) / (max - min);
            else
                colorHsl.Hue = 4.0f + (r - g) / (max - min);

            colorHsl.Hue *= 60;

            if (colorHsl.Hue < 0)
                colorHsl.Hue += 360;
        }

        return colorHsl;
    }

    private void BtnSelectColor_Click(object sender, RoutedEventArgs e)
    {

    }
}