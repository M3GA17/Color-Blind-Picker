using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.BusinessLayer.Services;
using System.Windows;

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

    public RelayCommand DeleteCommand => new(execute: DeleteCommandExecute);
    private void DeleteCommandExecute(object parameter)
    {
        // Implementa la logica di eliminazione qui
    }

    void PickColorOn()
    {
        if (new TransparentWindow().ShowDialog() == true)
        {
            PickColor = false;
            FileService.AddColor(new ColorModel(ColorModel.Hex));
            Clipboard.SetText("#" + ColorModel.Hex);
        }
    }
}
