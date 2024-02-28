using ColorBlindPicker.ApplicationLayer.ViewModels;
using System.Collections.ObjectModel;
using System.IO;

namespace ColorBlindPicker.BusinessLayer.Services
{
    public class ColorFileService : BaseViewModel
    {
        private const string FilePath = "colorList.txt";

        public ColorFileService()
        {
            Colors = new ObservableCollection<string>(LoadColorList());
        }

        private ObservableCollection<string> colors;

        public ObservableCollection<string> Colors
        {
            get { return colors; }
            set
            {
                if (colors != value)
                {
                    colors = value;
                    OnPropertyChanged(nameof(Colors));
                }
            }
        }

        public void AddColor(string hexColor)
        {
            if (!Colors.Contains(hexColor))
            {
                Colors.Add(hexColor);
                SaveColorList();
                Colors.Add(hexColor);
            }
        }

        public void RemoveColor(string hexColor)
        {
            Colors.Remove(hexColor);
            SaveColorList();
            Colors.Remove(hexColor);
        }

        public void RemoveAllColors()
        {
            Colors.Clear();
            SaveColorList();
            Colors.Clear();
        }

        private List<string> LoadColorList()
        {
            if (File.Exists(FilePath))
            {
                try
                {
                    return File.ReadAllLines(FilePath).ToList();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Errore durante la lettura del file: {ex.Message}");
                }
            }

            return new List<string>();
        }

        private void SaveColorList()
        {
            try
            {
                File.WriteAllLines(FilePath, Colors);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Errore durante la scrittura del file: {ex.Message}");
            }
        }
    }
}
