using System.Globalization;
using System.Windows;
using WPFLocalizeExtension.Engine;

namespace ColorBlindPicker
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            LocalizeDictionary.Instance.SetCurrentThreadCulture = true;
            LocalizeDictionary.Instance.Culture = new CultureInfo("en");

            // Imposta la cultura predefinita (es. "en" per inglese)
            //CultureInfo.DefaultThreadCurrentUICulture = new CultureInfo("en");
            //CultureInfo.DefaultThreadCurrentCulture = new CultureInfo("en");

            base.OnStartup(e); // Assicurati di chiamare il metodo base
        }
    }

}
