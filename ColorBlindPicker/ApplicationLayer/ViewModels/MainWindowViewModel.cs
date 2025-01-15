using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.BusinessLayer.Services;
using ColorBlindPicker.Windows;
using System.Windows;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;

public class MainWindowViewModel : BaseViewModel
{
    readonly MainWindow mainWindow = (MainWindow)Application.Current.MainWindow;
    public ColorFileService FileService { get; set; } = new();

    private bool alwaysOnTop;
    private bool viewHistory;
    private bool pickColor;
    public RelayCommand OpenSettingsCommand { get; }

    public MainWindowViewModel()
    {
        OpenSettingsCommand = new RelayCommand(OnOpenSettings);
    }

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
                PickColorOn();
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

    void PickColorOn()
    {
        if (new TransparentWindow().ShowDialog() == true)
        {
            PickColor = false;
            FileService.AddColor(new ColorModel(ColorModel.Hex));
            Clipboard.SetText("#" + ColorModel.Hex);
            new PopUpCopiedWindow().Show();
        }
    }

    void OnOpenSettings(object parameter)
    {
        mainWindow.BlurWindow(true);

        new SettingsWindow().ShowDialog();

        mainWindow.BlurWindow(false);
    }
}
