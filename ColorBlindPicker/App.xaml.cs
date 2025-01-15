using ColorBlindPicker.Properties;
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
            LocalizeDictionary.Instance.Culture = new CultureInfo(Settings.Default.Localization);

            base.OnStartup(e); // Assicurati di chiamare il metodo base
        }
    }

}
