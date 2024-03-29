﻿using ColorBlindPicker.ApplicationLayer.ViewModels;
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
        get { return FindColorDescription(); }
    }
    public string Hex
    {
        get { return Color.ToArgb().ToString("X6")[2..]; }
    }

    public ColorModel()
    {

    }
    public ColorModel(string Hex)
    {
        string hexArgb = "FF" + Hex;

        // Convertire il valore esadecimale ARGB in colore
        int argbValue = Convert.ToInt32(hexArgb, 16);
        Color = Color.FromArgb(argbValue);

        //Color = Color.FromArgb(Convert.ToInt32(Hex));
    }

    //HSL Description
    readonly Dictionary<string, double> HueValues = new()
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
    readonly Dictionary<string, double> SaturationValues = new()
{
    {"Grigio", 0},
    {"Tendente al grigio", 0.25},
    {"Sbiadito", 0.50},
    {"Leggermente sbiadito", 0.75},
    {"Normale", 1}
};
    readonly Dictionary<string, double> BrightnessValues = new()
{
    {"Nero", 0.0},
    {"Scuro", 0.25},
    {"Normale", 0.50},
    {"Chiaro", 0.75},
    {"Bianco", 1}
};
    public string FindColorDescription()
    {
        string hue = FindClosestValue(HslColor.Hue, HueValues);
        string saturation = FindClosestValue(HslColor.Saturation, SaturationValues);
        string lightness = FindClosestValue(HslColor.Lightness, BrightnessValues);

        if (lightness == "Nero" || lightness == "Bianco")
            return lightness;

        if (saturation == "Grigio")
            return saturation;


        string ColorDescription = hue;

        if (lightness != "Normale")
            ColorDescription += string.Concat(" ", lightness);

        if (saturation != "Normale")
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
}
