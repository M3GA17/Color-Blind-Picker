using ColorBlindPicker.ApplicationLayer.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace ColorBlindPicker.ApplicationLayer.ViewModels;
public class MainWindowViewModel : BaseViewModel
{
    private MouseHookManager mouseHookManager;

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

    public MainWindowViewModel()
    {
    }

    void pickColorOn()
    {
        mouseHookManager = new MouseHookManager();
        mouseHookManager.MouseClickOutside += MouseHook_MouseClickOutside;
        mouseHookManager.Start();
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
