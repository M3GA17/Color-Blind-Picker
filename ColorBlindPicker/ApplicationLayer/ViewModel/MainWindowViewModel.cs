using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ColorBlindPicker.ApplicationLayer.ViewModel;
public class MainWindowViewModel : BaseViewModel
{
    private bool alwaysOnTop;

    public bool AlwaysOnTop
    {
        get { return alwaysOnTop; }
        set 
        {
            alwaysOnTop = value; 
            OnPropertyChanged(nameof(AlwaysOnTop)); 
        }
    }
}
