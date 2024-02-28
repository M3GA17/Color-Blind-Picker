using ColorBlindPicker.ApplicationLayer.ViewModels;
using ColorBlindPicker.BusinessLayer.Extensions;

namespace ColorBlindPicker.ApplicationLayer.Models;

public class HslModel : BaseViewModel
{
    private float hue;
    public float Hue
    {
        get { return hue; }
        set
        {
            if (hue != value)
            {
                hue = value;
                OnPropertyChanged(nameof(Hue));
                OnPropertyChanged(nameof(ColorDescription));
            }
        }
    }

    private float saturation;
    public float Saturation
    {
        get { return saturation; }
        set
        {
            if (saturation != value)
            {
                saturation = value;
                OnPropertyChanged(nameof(Saturation));
                OnPropertyChanged(nameof(ColorDescription));
            }
        }
    }

    private float lightness;
    public float Lightness
    {
        get { return lightness; }
        set
        {
            if (lightness != value)
            {
                lightness = value;
                OnPropertyChanged(nameof(Lightness));
                OnPropertyChanged(nameof(ColorDescription));
            }
        }
    }

    public string ColorDescription
    {
        get { return this.FindColorDescription(); }
    }

}
