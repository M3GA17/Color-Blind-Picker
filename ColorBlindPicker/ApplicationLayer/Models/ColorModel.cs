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
        //Covert Hex RGB to ARGB color
        int argbValue = Convert.ToInt32("FF" + hexRgb, 16);
        Color = Color.FromArgb(argbValue);
    }


    public string GetColorDescriptionWithLocalization()
    {
        string result = string.Empty;

        foreach (var keyword in FindColorDescription().Split(' '))
        {
            result += string.Concat(" ", LocalizationProvider.GetLocalizedValue<string>(keyword));
        }

        return result;
    }
    public string FindColorDescription()
    {
        string hue = FindClosestValue(HslColor.Hue, HueValues);
        string saturation = FindClosestValue(HslColor.Saturation, SaturationValues);
        string lightness = FindClosestValue(HslColor.Lightness, BrightnessValues);

        if (lightness == "Black" || lightness == "White")
            return lightness;

        if (saturation == "Gray")
            return saturation;


        string ColorDescription = hue;

        if (lightness != "Normal")
            ColorDescription += string.Concat(" ", lightness);

        if (saturation != "Normal")
            ColorDescription += string.Concat(" ", saturation);


        return ColorDescription;
    }
    static string FindClosestValue(double numberToSearch, Dictionary<string, double> Values)
    {
        if (Values == null || Values.Count == 0)
        {
            throw new ArgumentException("Brightness values dictionary is empty or null.");
        }

        string closestSymbolicName = string.Empty;
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
    readonly Dictionary<string, double> HueValues = new()
    {
        {"Red", 0},
        {"Red_Orange", 15},
        {"Orange", 30},
        {"Yellow_Orange", 45},
        {"Yellow", 60},
        {"Yellowish_green", 75},
        {"Green", 120},
        {"Bluish_green", 195},
        {"Blue", 240},
        {"Bluish_purple", 255},
        {"Purple", 270},
        {"Reddish_purple", 315}
    };
    readonly Dictionary<string, double> SaturationValues = new()
    {
        {"Gray", 0},
        {"Grayish", 0.25},
        {"Faded", 0.50},
        {"Slightly_faded", 0.75},
        {"Normal", 1}
    };
    readonly Dictionary<string, double> BrightnessValues = new()
    {
        {"Black", 0.0},
        {"Dark", 0.25},
        {"Normal", 0.50},
        {"Bright", 0.75},
        {"White", 1}
    };

    //TODO: convert to wellKnown
}
