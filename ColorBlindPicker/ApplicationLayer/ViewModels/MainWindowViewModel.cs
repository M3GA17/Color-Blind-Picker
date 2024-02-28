using ColorBlindPicker.ApplicationLayer.Models;
using ColorBlindPicker.BusinessLayer.Services;
using System.Drawing;
using System.Windows;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;

public class MainWindowViewModel : BaseViewModel
{
    public ColorFileService FileService { get; set; } = new();
    private MouseHookManager mouseHookManager = new();

    private bool alwaysOnTop;
    private bool viewHistory;
    private bool pickColor;

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



    private HslModel hslColor;
    public HslModel HslColor
    {
        get { return hslColor; }
        set
        {
            hslColor = value;
            OnPropertyChanged(nameof(HslColor));
        }
    }

    private Color color;
    public Color Color
    {
        get { return color; }
        set
        {
            color = value;
            OnPropertyChanged(nameof(Color));
        }
    }

    //public MainWindowViewModel()
    //{
    //}

    void pickColorOn()
    {
        mouseHookManager.MouseClickOutside += MouseHook_MouseClickOutside;
        mouseHookManager.Start();
    }

    private void MouseHook_MouseClickOutside(object? sender, EventArgs e)
    {
        mouseHookManager.Stop();
        PickColor = false;

        FileService.AddColor(Color.Name);

        MessageBox.Show("Primo clic del mouse catturato ovunque!");
    }


    //private RelayCommand _myCommand;

    //public ICommand MyCommand
    //{
    //    get
    //    {
    //        if (_myCommand == null)
    //        {
    //            _myCommand = new RelayCommand(ExecuteMyCommand);
    //        }
    //        return _myCommand;
    //    }
    //}

    //private void ExecuteMyCommand(object obj)
    //{
    //    throw new NotImplementedException();
    //}
}
