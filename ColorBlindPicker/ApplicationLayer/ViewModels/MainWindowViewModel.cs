using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.BusinessLayer.Services;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;

public class MainWindowViewModel : BaseViewModel
{
    public ColorFileService FileService { get; set; } = new();

    private bool alwaysOnTop;
    private bool viewHistory;
    private bool pickColor;

    private ColorModel colorModel = new();
    public ColorModel ColorModel
    {
        get { return colorModel; }
        set
        {
            colorModel = value;
            OnPropertyChanged(nameof(ColorModel));
        }
    }
    public bool AlwaysOnTop
    {
        get { return alwaysOnTop; }
        set
        {
            alwaysOnTop = value;
            OnPropertyChanged(nameof(AlwaysOnTop));
        }
    }
    public bool PickColor
    {
        get { return pickColor; }
        set
        {
            pickColor = value;
            OnPropertyChanged(nameof(PickColor));
            if (value)
                pickColorOn();
        }
    }
    public bool ViewHistory
    {
        get { return viewHistory; }
        set
        {
            viewHistory = value;
            OnPropertyChanged(nameof(ViewHistory));
        }
    }

    void pickColorOn()
    {
        if (new TransparentWindow().ShowDialog() == true)
        {
            PickColor = false;
            FileService.AddColor(new ColorModel(ColorModel.Hex));
        }
    }
}
