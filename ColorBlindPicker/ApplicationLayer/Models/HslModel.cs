using ColorBlindPicker.ApplicationLayer.ViewModels;

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
            }
        }
    }
}
