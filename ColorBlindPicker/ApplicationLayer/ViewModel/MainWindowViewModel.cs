using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ColorBlindPicker.ApplicationLayer.ViewModel;
public class MainWindowViewModel : BaseViewModel
{
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
}
