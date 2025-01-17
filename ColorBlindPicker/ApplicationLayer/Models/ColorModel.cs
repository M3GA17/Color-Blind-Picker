using ColorBlindPicker.ApplicationLayer.ViewModels;
using ColorBlindPicker.BusinessLayer.Helpers;
using System.Drawing;


namespace ColorBlindPicker.ApplicationLayer.Models;

public class ColorModel : BaseViewModel
{
    private HslModel hslColor = new();
    public HslModel HslColor
    {
        get { return hslColor; }
        set
        {
            hslColor = value;
            OnPropertyChanged(nameof(HslColor));
        }
    }

    private Color color = new();
    public Color Color
    {
        get { return color; }
        set
        {
            color = value;
            OnPropertyChanged(nameof(Color));
            OnPropertyChanged(nameof(ColorBrush));
            OnPropertyChanged(nameof(Description));
            OnPropertyChanged(nameof(Hex));
            HslColor = ConvertToHsl(Color);
        }
    }

    public System.Windows.Media.SolidColorBrush ColorBrush
    {
        get { return ConvertToSolidColorBrush(); }
    }
    public string Description
    {
        get { return GetColorDescriptionWithLocalization(); }
    }
    public string Hex
    {
        get { return Color.ToArgb().ToString("X6")[2..]; }
    }

    public ColorModel()
    {

    }
    public ColorModel(string hexRgb)
    {
        int argbValue = Convert.ToInt32("FF" + hexRgb, 16);
        Color = Color.FromArgb(argbValue);
    }


    public string GetColorDescriptionWithLocalization()
    {
        string result = string.Empty;

        foreach (var keyword in FindColorDescriptionCheckpoints().Split(' '))
        {
            result += string.Concat(" ", LocalizationProvider.GetLocalizedValue<string>(keyword));
        }

        return result;
    }
    public string FindColorDescriptionCheckpoints()
    {
        double hue = FindClosestValue(HslColor.Hue, HueCheckpoints);
        double saturation = FindClosestValue(HslColor.Saturation, SaturationCheckpoints);
        double lightness = FindClosestValue(HslColor.Lightness, BrightnessCheckpoints);

        if (lightness == 0 || lightness == 1)
            return string.Concat("Bright", lightness.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (saturation == 0)
            return string.Concat("Sat", saturation.ToString(System.Globalization.CultureInfo.InvariantCulture));

        string ColorDescription = string.Concat("Hue", hue.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (lightness != 0.5)
            ColorDescription += string.Concat(" Bright", lightness.ToString(System.Globalization.CultureInfo.InvariantCulture));

        if (saturation != 1)
            ColorDescription += string.Concat(" Sat", saturation.ToString(System.Globalization.CultureInfo.InvariantCulture));


        return ColorDescription;
    }
    static double FindClosestValue(double numberToSearch, double[] Values)
    {
        double minDifference = double.MaxValue;
        double closestValue = 0;

        foreach (var value in Values)
        {
            double currentDifference = Math.Abs(numberToSearch - value);

            if (currentDifference < minDifference)
            {
                minDifference = currentDifference;
                closestValue = value;
            }
        }

        return closestValue;
    }

    //HSL

    static HslModel ConvertToHsl(Color color)
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
    public System.Windows.Media.SolidColorBrush ConvertToSolidColorBrush()
    {
        return new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromArgb(Color.A, Color.R, Color.G, Color.B));
    }

    //HSL Checkpoint
    readonly double[] HueCheckpoints = [0,10,20,30,40,50,60,70,80,90,
                                        100, 110, 120, 130, 140, 150, 160, 170, 180, 190,
                                        200, 210, 220, 230, 240, 250, 260, 270, 280, 290,
                                        300, 310, 320, 330, 340, 350, 360];

    readonly double[] SaturationCheckpoints = [0, 0.25, 0.5, 0.75, 1];
    readonly double[] BrightnessCheckpoints = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1];


    //TODO: convert to wellKnown
}
